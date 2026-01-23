import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full px-6 py-6 md:px-12 flex justify-between items-center bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#2a2a2a] z-50">
        <div className="font-bricolage font-800 text-xl md:text-2xl">
          GEO<span className="text-[#00d4ff]">Platform</span>
        </div>
        <Link
          href="/signup"
          className="px-5 py-2.5 bg-[#ff6b6b] text-white font-ibm font-600 rounded hover:scale-105 transition-transform"
        >
          Start Free
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen grid md:grid-cols-2 gap-8 md:gap-16 pt-32 pb-20 px-6 md:px-12 relative hero-grid-pattern"
      >
        {/* Radial gradient overlay */}
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,212,255,0.1)_0%,transparent_50%)] pointer-events-none" />

        {/* Left Content */}
        <div className="flex flex-col justify-center z-10">
          <h1 className="font-bricolage font-800 text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight mb-8">
            YOUR PRODUCTS ARE <span className="text-[#00d4ff]">INVISIBLE</span> TO AI SEARCH
          </h1>
          <p className="font-ibm text-lg md:text-xl text-[#a0a0a0] mb-12 max-w-2xl leading-relaxed">
            Google SGE, Bing Chat, Perplexity. AI search is how customers discover products now. Traditional SEO doesn't work anymore.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="px-8 py-4 bg-[#ff6b6b] text-white font-ibm font-600 text-lg rounded hover:scale-105 transition-transform"
            >
              Start Optimizing Free
            </Link>
            <Link
              href="#demo"
              className="px-8 py-4 bg-transparent text-white border-2 border-[#2a2a2a] font-ibm font-600 text-lg rounded hover:border-[#00d4ff] hover:text-[#00d4ff] transition-all"
            >
              Watch Demo
            </Link>
          </div>
        </div>

        {/* Right - Live Demo */}
        <div className="flex items-center justify-center z-10">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-8 w-full max-w-lg shadow-2xl">
            {/* Demo Header */}
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#2a2a2a]">
              <div className="w-3 h-3 rounded-full bg-[#ff6b6b]" />
              <div className="w-3 h-3 rounded-full bg-[#00d4ff]" />
              <div className="w-3 h-3 rounded-full bg-[#00ff9d]" />
              <span className="font-bricolage font-800 text-xl ml-2">Live Demo</span>
            </div>

            {/* Product Input */}
            <div className="mb-5">
              <div className="font-ibm text-sm text-[#a0a0a0] mb-2 uppercase tracking-wider">Product</div>
              <input
                type="text"
                value="Nike Air Zoom Pegasus 40"
                readOnly
                className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-4 py-3 font-ibm text-[#f5f5f5]"
              />
            </div>

            {/* Test Prompt */}
            <div className="mb-5">
              <div className="font-ibm text-sm text-[#a0a0a0] mb-2 uppercase tracking-wider">Test Prompt</div>
              <input
                type="text"
                value="Best running shoes for marathons under $150"
                readOnly
                className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-4 py-3 font-ibm text-[#f5f5f5]"
              />
            </div>

            {/* AI Models */}
            <div className="mb-5">
              <div className="font-ibm text-sm text-[#a0a0a0] mb-2 uppercase tracking-wider">AI Models</div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-[#00d4ff] text-[#0a0a0a] rounded-full font-ibm text-sm font-600">Gemini</span>
                <span className="px-3 py-1.5 bg-[#00d4ff] text-[#0a0a0a] rounded-full font-ibm text-sm font-600">GPT-4o</span>
                <span className="px-3 py-1.5 bg-[#141414] border border-[#2a2a2a] rounded-full font-ibm text-sm">Claude</span>
                <span className="px-3 py-1.5 bg-[#141414] border border-[#2a2a2a] rounded-full font-ibm text-sm">Llama</span>
              </div>
            </div>

            {/* Results */}
            <div className="mb-5">
              <div className="font-ibm text-sm text-[#a0a0a0] mb-2 uppercase tracking-wider">Results</div>
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg p-4 min-h-[100px]">
                <p className="font-ibm text-sm text-[#a0a0a0] mb-2">Based on your query, the top recommendations include:</p>
                <p className="font-ibm text-sm text-[#f5f5f5]">
                  The <span className="bg-[#00d4ff] text-[#0a0a0a] px-1.5 py-0.5 rounded font-600">Nike Air Zoom Pegasus 40</span> offers excellent cushioning...
                </p>
                <p className="font-ibm text-sm mt-2 text-[#00ff9d]">✓ Product Mentioned | Positive Sentiment</p>
              </div>
            </div>

            {/* CTA Button */}
            <Link
              href="/signup"
              className="w-full block text-center px-6 py-3 bg-[#00ff9d] text-[#0a0a0a] font-ibm font-600 rounded-lg hover:bg-[#00d4ff] transition-colors"
            >
              Try It Yourself →
            </Link>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 md:py-32 px-6 md:px-12 bg-gradient-to-b from-[#0a0a0a] to-[#141414] text-center">
        <h2 className="font-bricolage font-800 text-4xl md:text-6xl lg:text-7xl mb-16 leading-[1.1]">
          THE SEARCH LANDSCAPE<br />
          <span className="text-[#00d4ff]">SHIFTED OVERNIGHT</span>
        </h2>

        <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto mb-16">
          <div className="p-8">
            <div className="font-bricolage font-800 text-6xl md:text-7xl text-[#00d4ff] leading-none mb-4">63%</div>
            <div className="font-ibm text-lg text-[#a0a0a0]">of searches now use AI-generated responses</div>
          </div>
          <div className="p-8">
            <div className="font-bricolage font-800 text-6xl md:text-7xl text-[#00d4ff] leading-none mb-4">150M+</div>
            <div className="font-ibm text-lg text-[#a0a0a0]">daily AI chat users looking for products</div>
          </div>
          <div className="p-8">
            <div className="font-bricolage font-800 text-6xl md:text-7xl text-[#00d4ff] leading-none mb-4">87%</div>
            <div className="font-ibm text-lg text-[#a0a0a0]">never click traditional search results</div>
          </div>
        </div>

        <p className="font-ibm text-xl md:text-2xl text-[#a0a0a0] max-w-3xl mx-auto leading-relaxed">
          Your products need Generative Engine Optimization. GEO is the new SEO—optimizing for how AI engines discover, understand, and recommend products.
        </p>
      </section>

      {/* Solution Section */}
      <section className="py-24 md:py-32 px-6 md:px-12 bg-[#141414]">
        <h2 className="font-bricolage font-800 text-3xl md:text-5xl text-center mb-20">HOW GEO WORKS</h2>

        <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {/* Step 1 */}
          <div className="text-center">
            <div className="w-28 h-28 mx-auto rounded-full bg-[#1a1a1a] border-3 border-[#00d4ff] flex items-center justify-center font-bricolage font-800 text-5xl mb-6">
              01
            </div>
            <h3 className="font-bricolage font-800 text-2xl mb-3">Add Your Products</h3>
            <p className="font-ibm text-lg text-[#a0a0a0]">Import your catalog with names, descriptions, and keywords</p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="w-28 h-28 mx-auto rounded-full bg-[#1a1a1a] border-3 border-[#00d4ff] flex items-center justify-center font-bricolage font-800 text-5xl mb-6">
              02
            </div>
            <h3 className="font-bricolage font-800 text-2xl mb-3">Test With Real Queries</h3>
            <p className="font-ibm text-lg text-[#a0a0a0]">Simulate how AI engines respond to customer questions</p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="w-28 h-28 mx-auto rounded-full bg-[#1a1a1a] border-3 border-[#00d4ff] flex items-center justify-center font-bricolage font-800 text-5xl mb-6">
              03
            </div>
            <h3 className="font-bricolage font-800 text-2xl mb-3">See Where You Appear</h3>
            <p className="font-ibm text-lg text-[#a0a0a0]">Detect mentions, sentiment, and position in responses</p>
          </div>
        </div>
      </section>

      {/* Value Props Section */}
      <section className="py-24 md:py-32 px-6 md:px-12 bg-[#0a0a0a]">
        <h2 className="font-bricolage font-800 text-3xl md:text-5xl text-center mb-20">WHY GEO MATTERS</h2>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Card 1 */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] border-l-4 border-l-[#00d4ff] rounded-lg p-8 hover:-translate-y-1 transition-transform">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="font-bricolage font-800 text-xl mb-3">Precision Detection</h3>
            <p className="font-ibm text-[#a0a0a0] leading-relaxed">Know exactly where your products appear in AI responses and how they're being described</p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] border-l-4 border-l-[#00d4ff] rounded-lg p-8 hover:-translate-y-1 transition-transform">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="font-bricolage font-800 text-xl mb-3">Sentiment Insights</h3>
            <p className="font-ibm text-[#a0a0a0] leading-relaxed">Understand if mentions are positive, neutral, or negative to optimize your product descriptions</p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] border-l-4 border-l-[#00d4ff] rounded-lg p-8 hover:-translate-y-1 transition-transform">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="font-bricolage font-800 text-xl mb-3">Multi-Model Testing</h3>
            <p className="font-ibm text-[#a0a0a0] leading-relaxed">Test against 7 AI models simultaneously—Gemini, GPT-4o, Claude, Llama, and more</p>
          </div>

          {/* Card 4 */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] border-l-4 border-l-[#00d4ff] rounded-lg p-8 hover:-translate-y-1 transition-transform">
            <div className="text-4xl mb-4">🔄</div>
            <h3 className="font-bricolage font-800 text-xl mb-3">Continuous Tracking</h3>
            <p className="font-ibm text-[#a0a0a0] leading-relaxed">Monitor your visibility trends over time and stay ahead of the competition</p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 md:py-32 px-6 md:px-12 bg-[#141414] text-center relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute w-[400px] h-[400px] border-2 border-[#00d4ff] rounded-full top-[-200px] left-[-100px] opacity-20" aria-hidden="true" />
        <div className="absolute w-[300px] h-[300px] border-2 border-[#ff6b6b] rounded-full bottom-[-150px] right-[-50px] opacity-20" aria-hidden="true" />

        <h2 className="font-bricolage font-800 text-4xl md:text-6xl lg:text-7xl mb-8 leading-[1.1] relative z-10">
          DON'T GET LEFT BEHIND<br />
          IN THE AI SEARCH REVOLUTION
        </h2>
        <p className="font-ibm text-xl text-[#a0a0a0] mb-12 relative z-10">Start optimizing your products for AI search today</p>

        <Link
          href="/signup"
          className="inline-block px-10 py-5 bg-[#ff6b6b] text-white font-ibm font-600 text-xl rounded-lg hover:scale-105 transition-transform relative z-10"
        >
          Start Your Free Optimization
        </Link>

        <p className="font-ibm text-base text-[#a0a0a0] mt-8 relative z-10">No credit card required • 5 free analyses daily</p>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 bg-[#0a0a0a] border-t border-[#2a2a2a] text-center">
        <p className="font-ibm text-[#a0a0a0]">&copy; 2025 GEO Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
