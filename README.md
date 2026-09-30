# Study Smart Hub

BREAKING NOTES – COMPLETE MVP

Create a production-ready web application called Breaking Notes.

TECH STACK

Use:

React

TypeScript

Vite

Tailwind CSS

Shadcn UI

Supabase Authentication

Supabase Database

Supabase Storage

Supabase Realtime

Gemini API (for AI Study Assistant)

The application must be fully responsive for desktop and mobile.

Use a modern dark theme by default.

Generate all database tables, Supabase schemas, storage buckets, RLS policies, and setup instructions.

AUTHENTICATION

Implement:

Email Signup

Email Login

Forgot Password

Google Login

Each user profile should contain:

User ID

Username

Email

Profile Photo

Total Points

Current Streak

Best Streak

LAYOUT

Create a fixed left sidebar.

Sidebar items:

Timer

Notes Vault

Deadline Tracker

Leaderboard

Profile

At the bottom of the sidebar display:

Daily Streak

Total Points

The sidebar should collapse on mobile.

TIMER PAGE

Create a Pomodoro timer.

Preset buttons:

25 Minutes

50 Minutes

Controls:

Start

Pause

Resume

Reset

Features:

Notification popup when timer ends

Sound when timer ends

Session history

POINT SYSTEM

25-minute session = 10 points

50-minute session = 20 points

Store all sessions in Supabase.

Automatically update user points in profiles table.

NOTES VAULT

Create a centralized notes repository.

Only users with Admin role can upload files.

Normal users can only:

View

Search

Download

Allow uploads:

PDF

JPG

JPEG

PNG

Store files in Supabase Storage only.

Folder organization:

Semester
→ Subject
→ Files

Example:

Semester 1
→ Python Programming
→ Unit 1 Notes.pdf
→ Unit 2 Notes.pdf
→ PYQ.pdf

Semester 1
→ Mathematics
→ Formula Sheet.pdf

FILE METADATA

File Name

Subject

Semester

Upload Date

Uploaded By

Tags:

Notes

PYQ

Important

Lab Manual

Formula Sheet

Features:

Search files

Filter by Semester

Filter by Subject

Sort by newest

Sort alphabetically

Tag-based filtering

PHOTO + PDF VIEWER

Images:

Preview support

Fullscreen modal

Zoom in/out

PDFs:

In-browser viewer

Download option

Everything must use Supabase Storage only.

AI STUDY ASSISTANT (GEMINI API)

AI must ONLY work on uploaded notes.

NO general chatbot allowed.

FEATURES:

Summarize Note

For every PDF:

Button: "Summarize Note"

Workflow:

Extract PDF text

Send to Gemini API

Generate:

Short Summary

Key Concepts

Important Formulas

Exam Revision Points

Cache results in Supabase (ai_summaries table).

If summary exists → load from database instead of calling Gemini.

Generate Quiz

Button: "Generate Quiz"

Workflow:

Extract PDF text

Send to Gemini API

Generate:

Maximum 10 questions

MCQs

Short Answer Questions

Cache results in Supabase (ai_quizzes table).

If quiz exists → load cached version.

AI USAGE LIMITS

Each user gets:

3 AI requests per day

A request is:

Summarize Note OR

Generate Quiz

Create table:

ai_usage

user_id

date

requests_used

Before calling Gemini:

Check requests_used < 3

If limit reached → block request

Show message:
"You have used all 3 AI study requests for today. Please try again tomorrow."

SECURITY

Never expose Gemini API key in frontend

Use Supabase Edge Functions:
Frontend → Edge Function → Gemini API

Store API key in environment variables

DEADLINE TRACKER

Users can create tasks.

Task Fields:

Task Title

Description

Subject

Due Date

Difficulty

Difficulty:

Easy = 10 Points

Medium = 20 Points

Hard = 50 Points

Features:

Add Task

Edit Task

Delete Task

Mark Complete

Task Status:

Pending

Completed

Overdue

Points awarded automatically when task is completed.

Store everything in Supabase.

LEADERBOARD

Create a shared leaderboard for all users.

Display:

Rank

Username

Profile Photo

Total Points

Current Streak

Sorting:

Total Points

Streak

Use Supabase Realtime for live updates.

DAILY STREAK SYSTEM

Increase streak when user:

Completes at least one Pomodoro session OR

Completes at least one task

Track:

Current Streak

Best Streak

Reset streak if user misses a full day.

Store streak history in Supabase.

PROFILE PAGE

Show:

Username

Profile Photo

Total Points

Current Streak

Best Streak

Completed Tasks

Completed Pomodoro Sessions

Allow profile photo upload (Supabase Storage).

ADMIN PANEL

Admin can:

Upload notes

Delete notes

Edit metadata

Archive semesters

Manage subjects

Normal users:

View

Search

Download only

DATABASE TABLES

Generate:

profiles

pomodoro_sessions

tasks

streaks

notes

subjects

semesters

user_stats

ai_usage

ai_summaries

ai_quizzes

SUPABASE SETUP

Include:

SQL schema

Storage buckets:

notes

profile-photos

RLS policies

Authentication setup

Realtime setup

Edge Functions for Gemini API

DEPLOYMENT

Provide:

Supabase setup steps

Environment variables

Required env:

VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=

CODE REQUIREMENTS

Production-ready code

No mock data

No placeholder UI

Fully functional features

Mobile responsive

Dark theme

Clean architecture

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://study-buddy-ai-1634.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/111c80ed-dcf6-4383-a489-b91faeb5e5f4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
