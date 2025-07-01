#!/bin/bash

# Database Schema Fix Script for MovieRank
# This script helps fix common database schema issues

echo "🔧 MovieRank Database Schema Fix Script"
echo "========================================"

# Check if environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Missing Supabase environment variables"
    echo "Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

echo "✅ Environment variables found"

# Function to execute SQL
execute_sql() {
    local sql_file="$1"
    echo "📄 Executing $sql_file..."
    
    if [ ! -f "$sql_file" ]; then
        echo "❌ Error: $sql_file not found"
        return 1
    fi
    
    # Here you would typically use a tool like psql or a Node.js script
    # For now, we'll just output instructions
    echo "📋 SQL file ready for execution: $sql_file"
    echo "   Please run this file against your Supabase database"
}

# Main execution
echo ""
echo "🚀 Starting database schema fix..."

# Step 1: Run migration script
echo ""
echo "Step 1: Base migration"
execute_sql "supabase-migration.sql"

# Step 2: Setup movies table
echo ""
echo "Step 2: Movies table setup"
execute_sql "supabase_movies_setup.sql"

# Step 3: Setup upcoming movies table
echo ""
echo "Step 3: Upcoming movies table setup"
execute_sql "supabase_upcoming_movies_setup.sql"

echo ""
echo "✅ Database schema fix script completed!"
echo ""
echo "📝 Manual Steps Required:"
echo "1. Execute the SQL files in your Supabase SQL editor"
echo "2. Verify that RLS policies are active"
echo "3. Test database connections from your application"
echo "4. Run npm run dev to verify everything works"
echo ""
echo "🔍 Troubleshooting:"
echo "- If tables already exist, the scripts will not overwrite them"
echo "- Check Supabase dashboard for any error messages"
echo "- Verify that your service role key has sufficient permissions"
echo ""
