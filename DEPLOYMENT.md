# Supabase Edge Functions Deployment

This project includes automated deployment scripts for Supabase Edge Functions.

## Available Scripts

### NPM Scripts (Recommended)

```bash
# Deploy all functions
npm run functions:deploy:all

# Deploy specific function
npm run functions:deploy get-registrations
npm run functions:deploy send-bulk-messages

# Deploy everything (build + functions)
npm run deploy

# Use the advanced deployment script
npm run deploy:functions
```

### Direct Scripts

```bash
# Shell script (simpler)
./scripts/deploy-functions.sh

# Node.js script (more features)
node scripts/deploy-functions.js
```

## Prerequisites

1. **Install Supabase CLI**

   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**

   ```bash
   supabase login
   ```

3. **Link your project** (if not already linked)
   ```bash
   npm run linkProject
   ```

## Functions in this Project

- **`get-registrations`**: Fetches registration data from Airtable
- **`send-bulk-messages`**: Handles WhatsApp bulk messaging via webhook

## Deployment Process

1. **Check Status**: Verify Supabase CLI is installed and you're logged in
2. **Find Functions**: Automatically discovers all functions in `supabase/functions/`
3. **Deploy Each**: Deploys functions one by one with status reporting
4. **Summary**: Shows success/failure count

## Environment Variables

Make sure your environment variables are set for production:

```bash
# Required for functions
AIRTABLE_API_KEY=your_airtable_key
AIRTABLE_BASE_ID=your_base_id
AIRTABLE_TABLE_ID=your_table_id
```

## Troubleshooting

### Common Issues

1. **"Not logged in"**

   ```bash
   supabase login
   ```

2. **"Project not linked"**

   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. **"Function not found"**

   - Check that functions exist in `supabase/functions/`
   - Verify function names match exactly

4. **"Permission denied"**
   ```bash
   chmod +x scripts/deploy-functions.sh
   ```

### Manual Deployment

If scripts fail, you can deploy manually:

```bash
# Deploy individual functions
supabase functions deploy get-registrations
supabase functions deploy send-bulk-messages

# Check deployment status
supabase functions list
```

## Production Deployment

For production deployments:

1. **Build the frontend**

   ```bash
   npm run build
   ```

2. **Deploy functions**

   ```bash
   npm run functions:deploy:all
   ```

3. **Deploy frontend** (to your hosting platform)
   - Upload `dist/` folder to your hosting service
   - Configure environment variables

## Monitoring

After deployment, monitor your functions:

```bash
# View function logs
supabase functions logs get-registrations
supabase functions logs send-bulk-messages

# Check function status
supabase functions list
```
