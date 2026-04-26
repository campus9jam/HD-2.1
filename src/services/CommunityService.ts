import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp,
  Timestamp,
  where
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';

const COLLECTION_NAME = 'community_videos';

export interface CommunityVideo {
  youtubeId: string;
  title: string;
  category: 'Dandali' | 'Zare Global' | 'Co-Creators' | 'Uncategorized';
  thumbnail: string;
  publishedAt: string;
  status: 'pending' | 'published' | 'rejected' | 'archived';
  source: 'youtube_rss';
  ai_metadata?: {
    tags: string[];
    summary: string;
    cultural_context: string;
    multilingual_titles?: {
      hausa?: string;
      french?: string;
      arabic?: string;
    };
  };
  syncedBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Uses Leema AI (via Sovereign Backend) to perform high-fidelity cultural classification and metadata enrichment.
 */
export const classifyVideoWithAI = async (title: string, currentCategory: string) => {
  if (!title) return null;
  try {
    const response = await fetch('/api/media/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, currentCategory })
    });
    
    if (!response.ok) throw new Error("Neural link interrupted.");
    return await response.json();
  } catch (error) {
    console.error("Leema_Intelligence: Classification protocol failed.", error);
    return null;
  }
};

/**
 * Fetches all archived media artifacts from the sovereign database.
 */
export const fetchCommunityVideos = async (isAdmin: boolean = false): Promise<CommunityVideo[]> => {
  try {
    const vRef = collection(db, COLLECTION_NAME);
    let q;
    
    if (isAdmin) {
      q = query(vRef, orderBy('publishedAt', 'desc'));
    } else {
      q = query(vRef, where('status', '==', 'published'), orderBy('publishedAt', 'desc'));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as CommunityVideo);
  } catch (error) {
    if (error instanceof Error && error.message.includes('{')) throw error;
    handleFirestoreError(error, 'list', COLLECTION_NAME);
    return []; // Never reached but for TS
  }
};

/**
 * Syncs the Media OS archive with the latest signals from the YouTube RSS feed.
 * Utilizes a proxy to bypass CORS restrictions and Leema AI for enrichment.
 */
export const syncYouTubeRSS = async (channelId: string, userId: string): Promise<void> => {
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`;
  
  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error("Manifest ingestion failed.");
    
    const data = await response.json();
    const xmlText = data.contents;
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, 'text/xml');
    const entries = Array.from(xml.querySelectorAll('entry')).slice(0, 5); // Limit to 5 per sync for prototype stability

    for (const entry of entries) {
      const videoId = entry.querySelector('videoId')?.textContent;
      if (!videoId) continue;

      const title = entry.querySelector('title')?.textContent || 'Untitled Artifact';
      const published = entry.querySelector('published')?.textContent || new Date().toISOString();

      // Initial keyword classification
      let category: CommunityVideo['category'] = 'Uncategorized';
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes('dandali')) category = 'Dandali';
      else if (lowerTitle.includes('zare')) category = 'Zare Global';
      else if (lowerTitle.includes('co')) category = 'Co-Creators';

      // Leema AI Enrichment
      const aiEnrichment = await classifyVideoWithAI(title, category);

      const videoData: CommunityVideo = {
        youtubeId: videoId,
        title,
        category: aiEnrichment?.refinedCategory || category,
        publishedAt: published,
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        source: 'youtube_rss',
        status: 'pending', // New artifacts start in pending for editorial review
        ai_metadata: aiEnrichment ? {
          tags: aiEnrichment.tags,
          summary: aiEnrichment.summary,
          cultural_context: aiEnrichment.culturalContext,
          multilingual_titles: {
            hausa: aiEnrichment.hausaTitle,
            french: aiEnrichment.frenchTitle,
            arabic: aiEnrichment.arabicTitle
          }
        } : undefined,
        syncedBy: userId,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any
      };

      await setDoc(doc(db, COLLECTION_NAME, videoId), videoData, { merge: true });
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('{')) throw error;
    handleFirestoreError(error, 'write', COLLECTION_NAME);
  }
};

/**
 * Updates the editorial status of a video artifact.
 */
export const updateVideoStatus = async (videoId: string, status: CommunityVideo['status']): Promise<boolean> => {
  try {
    await setDoc(doc(db, COLLECTION_NAME, videoId), { 
      status, 
      updatedAt: serverTimestamp() 
    }, { merge: true });
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('{')) throw error;
    handleFirestoreError(error, 'update', `${COLLECTION_NAME}/${videoId}`);
    return false;
  }
};
