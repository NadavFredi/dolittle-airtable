#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const USER_EMAIL = 'admin@easyflow.co.il';
const USER_PASSWORD = 'AdminPass2024!';

async function setupLocalUser() {
    console.log('🚀 Setting up local user...');

    try {
        // Create Supabase client
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        console.log(`📧 Creating user: ${USER_EMAIL}`);

        // Sign up the user
        const { data, error } = await supabase.auth.signUp({
            email: USER_EMAIL,
            password: USER_PASSWORD,
        });

        if (error) {
            if (error.message.includes('already registered')) {
                console.log('✅ User already exists!');
                return;
            }
            throw error;
        }

        if (data.user) {
            console.log('✅ User created successfully!');
            console.log(`   User ID: ${data.user.id}`);
            console.log(`   Email: ${data.user.email}`);

            // Confirm the user (for local development)
            if (data.user.email_confirmed_at === null) {
                console.log('📧 Confirming user email...');
                const { error: confirmError } = await supabase.auth.admin.updateUserById(
                    data.user.id,
                    { email_confirm: true }
                );

                if (confirmError) {
                    console.log('⚠️  Could not auto-confirm email, but user was created');
                    console.log('   You may need to confirm manually in Supabase Studio');
                } else {
                    console.log('✅ User email confirmed!');
                }
            }
        } else {
            console.log('⚠️  User creation response was empty');
        }

    } catch (error) {
        console.error('❌ Error setting up user:', error.message);
        process.exit(1);
    }
}

// Run the setup
setupLocalUser();
