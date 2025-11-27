#!/bin/bash
echo "🚀 Deploying nextn-app to Cloud Run..."
gcloud run deploy nextn-app \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
