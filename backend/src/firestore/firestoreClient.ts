import { Firestore } from '@google-cloud/firestore';

const projectId = process.env.GCP_PROJECT_ID;

if (!projectId) {
  console.warn('[FirestoreClient]: GCP_PROJECT_ID environment variable is not defined. Firestore initialization may fall back to default credentials environment.');
}

export const db = new Firestore({
  projectId: projectId,
});
export default db;
