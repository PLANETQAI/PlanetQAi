'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { EnvelopeIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';

// Import the rich text editor dynamically to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

export default function NewsletterPage() {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [selectedUserGroup, setSelectedUserGroup] = useState('all');
  const [isSending, setIsSending] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const [sentCount, setSentCount] = useState(0);

  const userGroups = [
    { id: 'all', name: 'All Users' },
    { id: 'premium', name: 'Premium Users' },
    { id: 'basic', name: 'Basic Users' },
    { id: 'unverified', name: 'Unverified Users' },
    { id: 'inactive', name: 'Inactive Users (No songs in 30 days)' },
  ];
  
  const newsletterTemplates = [
    { id: 'blank', name: 'Blank Template' },
    { id: 'welcome', name: 'Welcome Message' },
    { id: 'feature', name: 'New Feature Announcement' },
    { id: 'promotion', name: 'Special Promotion' },
    { id: 'update', name: 'Platform Update' },
  ];
  
  // Template content for different newsletter types
  const getTemplateContent = (templateId) => {
    switch(templateId) {
      case 'welcome':
        return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #6366F1; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Welcome to PlanetQAi!</h1>
          </div>
          <div style="padding: 20px; background-color: #f9fafb;">
            <p>Hello [User Name],</p>
            <p>We're thrilled to have you join our community of music creators and innovators!</p>
            <p>With PlanetQAi, you can:</p>
            <ul>
              <li>Generate professional-quality music with AI</li>
              <li>Explore different musical styles and genres</li>
              <li>Build your personal music portfolio</li>
              <li>Connect with other creators</li>
            </ul>
            <p>To help you get started, we've added 50 credits to your account. You can use these to create your first songs!</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="[APP_URL]/aistudio" style="background-color: #6366F1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Start Creating Now</a>
            </div>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Happy creating!</p>
            <p>The PlanetQAi Team</p>
          </div>
          <div style="background-color: #374151; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p>© 2025 PlanetQAi. All rights reserved.</p>
            <p>You're receiving this email because you signed up for PlanetQAi.</p>
            <p><a href="[UNSUBSCRIBE_LINK]" style="color: #9CA3AF;">Unsubscribe</a></p>
          </div>
        </div>`;
      
      case 'feature':
        return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #6366F1; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Exciting New Features!</h1>
          </div>
          <div style="padding: 20px; background-color: #f9fafb;">
            <p>Hello [User Name],</p>
            <p>We're excited to announce some powerful new features that just launched on PlanetQAi!</p>
            <div style="background-color: #e0e7ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #4338ca; margin-top: 0;">New Feature Highlight</h2>
              <p>We've added [Feature Name] that allows you to [Feature Description]. This has been one of our most requested features, and we're thrilled to finally bring it to you.</p>
              <img src="[FEATURE_IMAGE_URL]" alt="New Feature Preview" style="max-width: 100%; height: auto; margin: 15px 0; border-radius: 4px;">
            </div>
            <p>But that's not all! Here's what else is new:</p>
            <ul>
              <li><strong>Improved AI Generation:</strong> Better quality outputs with more control</li>
              <li><strong>Enhanced User Interface:</strong> A more intuitive experience</li>
              <li><strong>Performance Upgrades:</strong> Faster loading times and smoother interactions</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="[APP_URL]/aistudio" style="background-color: #6366F1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Try The New Features</a>
            </div>
            <p>We'd love to hear your feedback on these new additions!</p>
            <p>The PlanetQAi Team</p>
          </div>
          <div style="background-color: #374151; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p>© 2025 PlanetQAi. All rights reserved.</p>
            <p><a href="[UNSUBSCRIBE_LINK]" style="color: #9CA3AF;">Unsubscribe</a></p>
          </div>
        </div>`;
      
      case 'promotion':
        return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #7e22ce; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Special Offer Just For You!</h1>
          </div>
          <div style="padding: 20px; background-color: #f9fafb;">
            <p>Hello [User Name],</p>
            <p>We're excited to bring you an exclusive offer to enhance your music creation journey!</p>
            <div style="background-color: #f3e8ff; border: 2px dashed #a855f7; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h2 style="color: #7e22ce; margin-top: 0;">LIMITED TIME OFFER</h2>
              <p style="font-size: 18px;">Get <strong>50% OFF</strong> when you upgrade to Premium</p>
              <p style="font-size: 14px; color: #6b7280;">Offer valid until [EXPIRATION_DATE]</p>
              <div style="font-size: 24px; font-weight: bold; color: #7e22ce; margin: 15px 0;">Use code: <span style="background-color: #e9d5ff; padding: 5px 10px; border-radius: 4px;">PLANET50</span></div>
            </div>
            <p>With Premium, you'll enjoy:</p>
            <ul>
              <li><strong>500 monthly credits</strong> for more music creation</li>
              <li><strong>Priority processing</strong> for faster generation</li>
              <li><strong>Advanced editing tools</strong> for perfect results</li>
              <li><strong>Unlimited downloads</strong> of your creations</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="[APP_URL]/pricing" style="background-color: #7e22ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Claim Your Discount</a>
            </div>
            <p>Don't miss out on this limited-time opportunity to elevate your music creation experience!</p>
            <p>The PlanetQAi Team</p>
          </div>
          <div style="background-color: #374151; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p>© 2025 PlanetQAi. All rights reserved.</p>
            <p><a href="[UNSUBSCRIBE_LINK]" style="color: #9CA3AF;">Unsubscribe</a></p>
          </div>
        </div>`;
      
      case 'update':
        return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0891b2; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Platform Update</h1>
          </div>
          <div style="padding: 20px; background-color: #f9fafb;">
            <p>Hello [User Name],</p>
            <p>We're writing to inform you about some important updates to the PlanetQAi platform.</p>
            <div style="background-color: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #0e7490; margin-top: 0;">What's Changing</h2>
              <p>We've made several improvements to enhance your experience:</p>
              <ul>
                <li><strong>System Upgrade:</strong> We've upgraded our backend systems for better performance</li>
                <li><strong>Security Enhancements:</strong> Additional measures to keep your account safe</li>
                <li><strong>Bug Fixes:</strong> Resolved several issues reported by our users</li>
              </ul>
            </div>
            <p>These changes will take effect on [EFFECTIVE_DATE]. You don't need to take any action - everything will update automatically.</p>
            <div style="background-color: #cffafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0e7490; margin-top: 0;">Scheduled Maintenance</h3>
              <p>To implement these updates, we'll have a brief maintenance period on:</p>
              <p style="text-align: center; font-weight: bold;">[MAINTENANCE_DATE] from [START_TIME] to [END_TIME] UTC</p>
              <p>During this time, the platform may be temporarily unavailable.</p>
            </div>
            <p>We appreciate your patience as we work to improve PlanetQAi. If you have any questions, please contact our support team.</p>
            <p>Thank you for being part of our community!</p>
            <p>The PlanetQAi Team</p>
          </div>
          <div style="background-color: #374151; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p>© 2025 PlanetQAi. All rights reserved.</p>
            <p><a href="[UNSUBSCRIBE_LINK]" style="color: #9CA3AF;">Unsubscribe</a></p>
          </div>
        </div>`;
      
      default: // blank template
        return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #6366F1; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">PlanetQAi Newsletter</h1>
          </div>
          <div style="padding: 20px; background-color: #f9fafb;">
            <p>Hello [User Name],</p>
            <p>Your newsletter content here...</p>
            <p>The PlanetQAi Team</p>
          </div>
          <div style="background-color: #374151; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p>© 2025 PlanetQAi. All rights reserved.</p>
            <p><a href="[UNSUBSCRIBE_LINK]" style="color: #9CA3AF;">Unsubscribe</a></p>
          </div>
        </div>`;
    }
  };

  // Load template content when template is selected
  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    setSelectedTemplate(templateId);
    
    if (templateId !== 'blank') {
      // Set default subject based on template
      const subjectMap = {
        'welcome': 'Welcome to PlanetQAi!',
        'feature': 'Exciting New Features on PlanetQAi',
        'promotion': 'Special Offer: 50% Off Premium Upgrade',
        'update': 'Important Platform Update',
      };
      setSubject(subjectMap[templateId] || '');
      
      // Set template content
      setContent(getTemplateContent(templateId));
    }
  };
  
  const handleSendNewsletter = async (isTest = false) => {
    try {
      if (!subject.trim()) {
        toast.error('Please enter a subject');
        return;
      }

      if (!content.trim() || content === '<p><br></p>') {
        toast.error('Please enter some content');
        return;
      }

      if (isTest && !testEmail.trim()) {
        toast.error('Please enter a test email address');
        return;
      }

      setIsSending(true);

      // Call the newsletter API
      const response = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          content,
          userGroup: selectedUserGroup,
          isTest,
          testEmail: isTest ? testEmail : undefined,
          templateType: selectedTemplate
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send newsletter');
      }
      
      const data = await response.json();

      if (isTest) {
        toast.success(`Test email sent to ${testEmail}`);
      } else {
        // Update sent count from API response
        setSentCount(data.sentCount || 0);
        toast.success(`Newsletter sent to ${data.sentCount} recipients`);
        
        // Clear form after successful send
        setSubject('');
        setContent('');
        setSelectedTemplate('blank');
      }
    } catch (error) {
      console.error('Error sending newsletter:', error);
      toast.error(error.message || 'Failed to send newsletter');
    } finally {
      setIsSending(false);
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Send Newsletter</h1>
      
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="userGroup" className="block text-sm font-medium text-gray-300 mb-2">
              Select Recipients
            </label>
            <select
              id="userGroup"
              value={selectedUserGroup}
              onChange={(e) => setSelectedUserGroup(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {userGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="template" className="block text-sm font-medium text-gray-300 mb-2">
              Select Template
            </label>
            <select
              id="template"
              value={selectedTemplate}
              onChange={handleTemplateChange}
              className="block w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {newsletterTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mb-6">
          <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
            Subject
          </label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter newsletter subject"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Content
          </label>
          <div className={`${previewMode ? 'hidden' : 'block'}`}>
            <ReactQuill 
              theme="snow" 
              value={content} 
              onChange={setContent} 
              modules={modules}
              className="bg-gray-700 text-white rounded-md"
              placeholder="Write your newsletter content here..."
            />
          </div>
          
          {previewMode && (
            <div className="bg-gray-700 rounded-md p-4 prose prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: content }} />
            </div>
          )}
          
          <div className="mt-2 text-right">
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className="text-sm text-indigo-400 hover:text-indigo-300"
            >
              {previewMode ? 'Edit Content' : 'Preview Content'}
            </button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <label htmlFor="testEmail" className="block text-sm font-medium text-gray-300 mb-2">
              Test Email Address
            </label>
            <input
              type="email"
              id="testEmail"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter email for testing"
            />
          </div>
          
          <div className="flex space-x-4 md:self-end">
            <button
              type="button"
              onClick={() => handleSendNewsletter(true)}
              disabled={isSending}
              className={`px-4 py-2 rounded-md flex items-center ${
                isSending
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <EnvelopeIcon className="h-5 w-5 mr-2" />
              Send Test
            </button>
            
            <button
              type="button"
              onClick={() => handleSendNewsletter(false)}
              disabled={isSending}
              className={`px-4 py-2 rounded-md flex items-center ${
                isSending
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              <PaperAirplaneIcon className="h-5 w-5 mr-2" />
              {isSending ? 'Sending...' : 'Send Newsletter'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Newsletter Tips</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>Keep your subject line clear and concise</li>
          <li>Start with the most important information</li>
          <li>Include a clear call-to-action</li>
          <li>Use images sparingly to avoid spam filters</li>
          <li>Always send a test email to yourself first</li>
          <li>Include an unsubscribe link (automatically added)</li>
        </ul>
      </div>
    </div>
  );
}
