#!/bin/bash

echo "🧪 Testing NestJS Authentication Flow..."

BASE_URL="http://localhost:3001"

echo "1. Testing backend health..."
curl -s "$BASE_URL/health" | jq '.' || echo "❌ Health check failed"

echo -e "\n2. Testing non-auth endpoint..."
curl -s "$BASE_URL/test-no-auth" | jq '.' || echo "❌ No-auth test failed"

echo -e "\n3. Attempting registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123", 
    "name": "Test User"
  }')

echo "Register response: $REGISTER_RESPONSE"

# Extract token
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.access_token' 2>/dev/null)

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo -e "\n4. Registration failed, trying login..."
  LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "password123"
    }')
  
  echo "Login response: $LOGIN_RESPONSE"
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token' 2>/dev/null)
fi

if [ "$TOKEN" != "null" ] && [ ! -z "$TOKEN" ]; then
  echo -e "\n5. Testing authenticated endpoint..."
  curl -s -X GET "$BASE_URL/test-with-auth" \
    -H "Authorization: Bearer $TOKEN" \
    | jq '.' || echo "❌ Authenticated request failed"
    
  echo -e "\n6. Testing auth/verify endpoint..."
  curl -s -X GET "$BASE_URL/auth/verify" \
    -H "Authorization: Bearer $TOKEN" \
    | jq '.' || echo "❌ Token verification failed"
else
  echo "❌ Could not get valid token"
fi

echo -e "\n✅ Authentication flow test completed!"