// Mock mongoose models
export const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  firebaseUid: 'test-firebase-uid',
  email: 'test@example.com',
  createdAt: new Date(),
  updatedAt: new Date(),
  save: jest.fn().mockResolvedValue(this),
};

export const mockKeyword = {
  _id: '507f1f77bcf86cd799439012',
  name: 'Wireless Headphones',
  description: 'High-quality wireless headphones',
  category: 'Electronics',
  price: 99.99,
  keywords: ['bluetooth', 'noise-cancelling', 'audio'],
  user: mockUser._id,
  createdAt: new Date(),
  updatedAt: new Date(),
  save: jest.fn().mockResolvedValue(this),
};

export const mockPrompt = {
  _id: '507f1f77bcf86cd799439013',
  title: 'Test Prompt',
  content: 'What are the best keywords?',
  category: 'Keyword Discovery',
  user: mockUser._id,
  createdAt: new Date(),
  updatedAt: new Date(),
  save: jest.fn().mockResolvedValue(this),
};

export const mockResult = {
  _id: '507f1f77bcf86cd799439014',
  prompt: mockPrompt._id,
  llmModel: 'gemini-2.0-flash',
  response: 'Test response',
  keywordsMentioned: [],
  user: mockUser._id,
  createdAt: new Date(),
  save: jest.fn().mockResolvedValue(this),
};

// Mock Keyword.find
export const mockKeywordFind = {
  exec: jest.fn(),
  lean: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
};

// Mock Prompt.find
export const mockPromptFind = {
  exec: jest.fn(),
  lean: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
};

// Mock User.findOne
export const mockUserFindOne = {
  exec: jest.fn(),
  lean: jest.fn().mockReturnThis(),
};

// Mock Keyword create/update/delete
export const mockKeywordOperations = {
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
  find: jest.fn().mockReturnValue(mockKeywordFind),
};

// Mock Prompt operations
export const mockPromptOperations = {
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
  find: jest.fn().mockReturnValue(mockPromptFind),
};

// Mock User operations
export const mockUserOperations = {
  create: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn().mockReturnValue(mockUserFindOne),
};

// Mock mongoose connection
export const mockMongoose = {
  connect: jest.fn(),
  connection: {
    close: jest.fn(),
    dropDatabase: jest.fn(),
  },
};

// Helper to setup mocks
export function setupMocks() {
  jest.clearAllMocks();

  // Reset all mock return values
  mockKeywordFind.exec.mockResolvedValue([]);
  mockPromptFind.exec.mockResolvedValue([]);
  mockUserFindOne.exec.mockResolvedValue(mockUser);

  mockKeywordOperations.create.mockResolvedValue(mockKeyword);
  mockKeywordOperations.findById.mockResolvedValue(mockKeyword);
  mockKeywordOperations.findOne.mockResolvedValue(mockKeyword);

  mockPromptOperations.create.mockResolvedValue(mockPrompt);
  mockPromptOperations.findById.mockResolvedValue(mockPrompt);
  mockPromptOperations.findOne.mockResolvedValue(mockPrompt);

  mockUserOperations.create.mockResolvedValue(mockUser);
  mockUserOperations.findById.mockResolvedValue(mockUser);
}
