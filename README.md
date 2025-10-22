# Dolittle Airtable - Registration Management System

A beautiful React TypeScript application for managing course registrations, built with Vite and Supabase edge functions that integrate with Airtable.

## Features

- 📊 Beautiful Hebrew UI mimicking the original design
- 🔄 Real-time data from Airtable via Supabase edge functions
- 🎨 Modern UI with Tailwind CSS and shadcn/ui components
- 📱 Responsive design
- 🔍 Advanced filtering and grouping capabilities
- ⚡ Fast development with Vite

## Project Structure

```
dolittle-airtable/
├── src/                    # Frontend React app
│   ├── components/ui/     # Reusable UI components
│   ├── lib/              # Utility functions
│   └── App.tsx           # Main application component
├── supabase/             # Supabase configuration and edge functions
│   ├── functions/        # Edge functions for Airtable integration
│   └── config.toml      # Supabase configuration
└── package.json         # Dependencies and scripts
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your Airtable credentials:

```bash
cp env.example .env.local
```

Edit `.env.local` with your actual values:

- `AIRTABLE_PAT`: Your Airtable Personal Access Token
- `AIRTABLE_BASE_ID`: Your Airtable Base ID
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### 3. Supabase Setup

Initialize Supabase locally:

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Start Supabase locally
supabase start

# Set up your edge function secrets
supabase secrets set --env-file .env.local
```

### 4. Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:8080`

### 5. Edge Functions

To test edge functions locally:

```bash
npm run functions:local
```

## Airtable Integration

The app connects to Airtable using edge functions that:

- Fetch registration data from your Airtable base
- Transform the data to match the UI structure
- Handle authentication securely on the server side

### Required Airtable Fields

Make sure your Airtable base has a "Registrations" table with these fields:

- שם הילד (Child Name)
- מחזור (Cycle)
- טלפון הורה (Parent Phone)
- שם מלא הורה (Full Parent Name)
- חוג (Course)
- בית ספר (School)
- כיתה (Class)
- האם צריך איסוף מהצהרון (Needs Pickup)
- תאריך הגעה לשיעור ניסיון (Trial Date)
- האם בקבוצת הוואטסאפ (In WhatsApp Group)
- סטטוס רישום לחוג (Registration Status)

## Technologies Used

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase Edge Functions
- **Data**: Airtable API
- **Icons**: Lucide React

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run functions:local` - Run Supabase edge functions locally
- `npm run linkProject` - Link to Supabase project (update project ref)

## Security Notes

- Never commit your `.env.local` file
- Keep your Airtable PAT secure
- Use environment variables for all sensitive configuration
- Edge functions handle authentication server-side for security

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is private and proprietary.
