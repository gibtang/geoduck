// Google Analytics utility functions

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Track page views
export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined') {
    const win = window as typeof window & { gtag?: Function };
    if (win.gtag) {
      win.gtag('config', GA_MEASUREMENT_ID, {
        page_path: url,
      });
    }
  }
};

// Track custom events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined') {
    const win = window as typeof window & { gtag?: Function };
    if (win.gtag) {
      win.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }
  }
};

// Authentication Events
export const trackSignUp = (method: string = 'email') => {
  trackEvent('sign_up', 'authentication', method);
};

export const trackLogin = (method: string = 'email') => {
  trackEvent('login', 'authentication', method);
};

export const trackLogout = () => {
  trackEvent('logout', 'authentication');
};

// Product Management Events
export const trackCreateProduct = (productName: string, category?: string) => {
  trackEvent('create_product', 'product_management', category || 'uncategorized');
};

export const trackUpdateProduct = (productName: string, category?: string) => {
  trackEvent('update_product', 'product_management', category || 'uncategorized');
};

export const trackDeleteProduct = (productName: string, category?: string) => {
  trackEvent('delete_product', 'product_management', category || 'uncategorized');
};

// Prompt Management Events
export const trackCreatePrompt = (promptTitle: string, category?: string) => {
  trackEvent('create_prompt', 'prompt_management', category || 'uncategorized');
};

export const trackUpdatePrompt = (promptTitle: string, category?: string) => {
  trackEvent('update_prompt', 'prompt_management', category || 'uncategorized');
};

export const trackDeletePrompt = (promptTitle: string, category?: string) => {
  trackEvent('delete_prompt', 'prompt_management', category || 'uncategorized');
};

// Execution Events
export const trackExecutePrompt = (
  modelName: string,
  promptCategory?: string,
  modelsCount?: number
) => {
  const label = modelsCount && modelsCount > 1
    ? `Comparison: ${modelsCount} models`
    : modelName;

  trackEvent(
    'execute_prompt',
    promptCategory || 'prompt_execution',
    label,
    modelsCount || 1
  );
};

export const trackProductMentioned = (
  productName: string,
  modelName: string,
  sentiment: string
) => {
  trackEvent('product_mentioned', 'ai_response', `${modelName} - ${sentiment}`);
};

// Page View Tracking for Custom Pages
export const trackPageViewWithDetails = (
  pageName: string,
  additionalParams?: Record<string, string>
) => {
  if (typeof window !== 'undefined') {
    const win = window as typeof window & { gtag?: Function };
    if (win.gtag) {
      win.gtag('event', 'page_view', {
        page_title: pageName,
        ...additionalParams,
      });
    }
  }
};
