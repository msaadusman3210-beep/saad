# Supabase Configuration

For Supabase PostgreSQL database connection, set these environment variables in your Vercel project settings:

## Environment Variables

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-api-key-here
```

### Get your credentials from Supabase:
1. Go to your Supabase project dashboard
2. Click "Settings" (gear icon)
3. Copy the **Project URL** → Set as `SUPABASE_URL`
4. Copy the **anon public key** → Set as `SUPABASE_KEY`

## Steps to Set Up:

1. Create a Supabase project at https://supabase.com
2. Copy your credentials
3. Go to Vercel project settings → Environment Variables
4. Add the two variables above
5. Redeploy your project

## Using with Vercel:

The application will automatically initialize the database tables on first deployment with proper PostgreSQL setup.
