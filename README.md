# GEO Platform - Generative Engine Optimization

A powerful platform for optimizing e-commerce products for AI-powered search engines like Google SGE, Bing Chat, and Perplexity.

## Features

- **Firebase Authentication**: Secure user authentication with email/password
- **Product Management**: Create, read, update, and delete products with keywords
- **Prompt Library**: Save and organize test prompts for GEO analysis
- **Multi-LLM Support**: Execute prompts against multiple AI models via OpenRouter
- **Product Mention Detection**: Automatically detect if your products appear in AI responses
- **Sentiment Analysis**: Understand how your products are being described (positive/neutral/negative)
- **Multi-Model Comparison**: Compare results across different LLMs simultaneously
- **Results History**: Track all your prompt executions and their outcomes

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth
- **Database**: MongoDB with Mongoose
- **LLM Integration**: OpenRouter API with Vercel AI SDK
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB instance (local or MongoDB Atlas)
- Firebase project with Authentication enabled
- OpenRouter API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd geoduck
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

   Fill in the required values:
   ```env
   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/geoduck

   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # OpenRouter API Key
   OPENROUTER_API_KEY=your_openrouter_api_key

   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up Firebase**

   - Create a new Firebase project at https://console.firebase.google.com
   - Enable Authentication (Email/Password provider)
   - Copy your Firebase config values to `.env.local`

5. **Set up MongoDB**

   **Option A: Local MongoDB**
   ```bash
   # Install MongoDB
   brew install mongodb-community

   # Start MongoDB
   brew services start mongodb-community
   ```

   **Option B: MongoDB Atlas (Recommended for production)**
   - Create a free account at https://www.mongodb.com/cloud/atlas
   - Create a new cluster
   - Add your IP to the whitelist
   - Get your connection string and add to `.env.local`

6. **Get OpenRouter API Key**

   - Sign up at https://openrouter.ai
   - Get your API key from the dashboard
   - Add to `.env.local`

7. **Run the development server**
   ```bash
   npm run dev
   ```

8. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage Guide

### 1. Create an Account
- Click "Sign Up" on the home page
- Enter your email and password
- You'll be redirected to the dashboard

### 2. Add Products
- Navigate to the "Products" page
- Click "Add Product"
- Fill in:
  - Product name
  - Description
  - Category
  - Price
  - Keywords (comma-separated)
- Keywords help with product detection in AI responses

### 3. Create Prompts
- Navigate to the "Prompts" page
- Click "Create Prompt"
- Fill in:
  - Title (e.g., "Top Toys for Christmas")
  - Category (e.g., "Product Discovery")
  - Content (the actual prompt you want to test)

### 4. Execute Prompts
- Navigate to the "Execute" page
- Choose a saved prompt or write a custom one
- Select a primary model (e.g., Gemini, GPT-4, Claude)
- Optionally select additional models to compare
- Click "Execute Prompt"
- View results with product mentions highlighted

### 5. Analyze Results
- See the full AI response
- View which products were mentioned
- Check sentiment (positive/neutral/negative)
- See context around each product mention
- Compare results across multiple models

### 6. View History
- Navigate to the "Results" page
- See all past prompt executions
- Click on any result to expand details
- Track product visibility over time

## Database Schema

### User Model
```javascript
{
  firebaseUid: String,
  email: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Product Model
```javascript
{
  name: String,
  description: String,
  category: String,
  price: Number,
  keywords: [String],
  user: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Prompt Model
```javascript
{
  title: String,
  content: String,
  category: String,
  user: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Result Model
```javascript
{
  prompt: ObjectId,
  model: String,
  response: String,
  productsMentioned: [{
    product: ObjectId,
    position: Number,
    sentiment: String,
    context: String
  }],
  user: ObjectId,
  createdAt: Date
}
```

## API Routes

### Authentication
- `POST /api/users/create` - Create user in database after Firebase auth

### Products
- `GET /api/products` - Get all user's products
- `POST /api/products` - Create a new product
- `GET /api/products/[id]` - Get a single product
- `PUT /api/products/[id]` - Update a product
- `DELETE /api/products/[id]` - Delete a product

### Prompts
- `GET /api/prompts` - Get all user's prompts
- `POST /api/prompts` - Create a new prompt
- `GET /api/prompts/[id]` - Get a single prompt
- `PUT /api/prompts/[id]` - Update a prompt
- `DELETE /api/prompts/[id]` - Delete a prompt

### Execution
- `POST /api/execute` - Execute a prompt against LLM(s)
- `GET /api/execute` - Get available models

### Results
- `GET /api/results` - Get all user's results with pagination

## Supported LLM Models

- Gemini 2.0 Flash (Free)
- Gemini Pro
- GPT-4o
- GPT-4o Mini
- Claude 3.5 Sonnet
- Claude 3 Haiku
- Llama 3.1 70B (Free)

## Deployment

### Deploy to Vercel

1. **Push your code to GitHub**

2. **Set up environment variables in Vercel**
   - Go to your Vercel project settings
   - Add all environment variables from `.env.local`

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Set up MongoDB for production**
   - Use MongoDB Atlas for cloud hosting
   - Update `MONGODB_URI` in Vercel environment variables

## Project Structure

```
geoduck/
├── app/
│   ├── api/
│   │   ├── users/create/
│   │   ├── products/
│   │   ├── prompts/
│   │   ├── execute/
│   │   └── results/
│   ├── dashboard/
│   ├── products/
│   ├── prompts/
│   ├── execute/
│   ├── results/
│   ├── signin/
│   ├── signup/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── Header.tsx
├── lib/
│   ├── mongodb.ts
│   ├── firebase.ts
│   ├── openrouter.ts
│   ├── productDetection.ts
│   └── currentUser.ts
├── models/
│   ├── User.ts
│   ├── Product.ts
│   ├── Prompt.ts
│   └── Result.ts
├── middleware.ts
├── .env.example
└── package.json
```

## Future Enhancements

- [ ] Product import via CSV/JSON
- [ ] A/B testing for prompts
- [ ] Performance analytics dashboard
- [ ] Competitor tracking
- [ ] Optimization suggestions
- [ ] Scheduled monitoring
- [ ] Slack/Discord notifications
- [ ] Export results to CSV
- [ ] Team collaboration features

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository.

---

**Generated with [Claude Code](https://claude.ai/code)**
**via [Happy](https://happy.engineering)**

Co-Authored-By: Claude <noreply@anthropic.com>
Co-Authored-By: Happy <yesreply@happy.engineering>
