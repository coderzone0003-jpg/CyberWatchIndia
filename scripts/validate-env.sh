#!/bin/bash

# Environment Variable Validation Script
# Run this to check if all required environment variables are set

echo "======================================"
echo "Environment Variable Validation"
echo "======================================"
echo ""

# Backend validation
echo "Checking Backend Environment Variables..."
BACKEND_ENV_FILE="../backend/.env"

if [ ! -f "$BACKEND_ENV_FILE" ]; then
    echo "❌ Backend .env file not found"
    echo "   Please copy backend/.env.example to backend/.env and fill in the values"
else
    echo "✅ Backend .env file exists"
    
    # Check for required variables
    source "$BACKEND_ENV_FILE"
    
    MISSING_VARS=()
    
    [ -z "$PORT" ] && MISSING_VARS+=("PORT")
    [ -z "$SUPABASE_URL" ] && MISSING_VARS+=("SUPABASE_URL")
    [ -z "$SUPABASE_ANON_KEY" ] && MISSING_VARS+=("SUPABASE_ANON_KEY")
    [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] && MISSING_VARS+=("SUPABASE_SERVICE_ROLE_KEY")
    [ -z "$JWT_SECRET" ] && MISSING_VARS+=("JWT_SECRET")
    [ -z "$FRONTEND_URL" ] && MISSING_VARS+=("FRONTEND_URL")
    
    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        echo "❌ Missing backend environment variables:"
        for var in "${MISSING_VARS[@]}"; do
            echo "   - $var"
        done
    else
        echo "✅ All required backend environment variables are set"
    fi
fi

echo ""

# Frontend validation
echo "Checking Frontend Environment Variables..."
FRONTEND_ENV_FILE=".env"

if [ ! -f "$FRONTEND_ENV_FILE" ]; then
    echo "❌ Frontend .env file not found"
    echo "   Please copy .env.example to .env and fill in the values"
else
    echo "✅ Frontend .env file exists"
    
    source "$FRONTEND_ENV_FILE"
    
    MISSING_VARS=()
    
    [ -z "$REACT_APP_API_URL" ] && MISSING_VARS+=("REACT_APP_API_URL")
    
    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        echo "❌ Missing frontend environment variables:"
        for var in "${MISSING_VARS[@]}"; do
            echo "   - $var"
        done
    else
        echo "✅ All required frontend environment variables are set"
    fi
fi

echo ""
echo "======================================"
echo "Validation Complete"
echo "======================================"