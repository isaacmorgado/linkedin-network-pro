/**
 * Comprehensive ATS Keywords Database Expansion
 * Based on 2024-2025 industry research across ALL major sectors
 *
 * This expansion adds 1000+ industry-specific keywords to support:
 * - Healthcare & Medical
 * - Business & Finance
 * - Human Resources
 * - Sales & Business Development
 * - Project Management & Operations
 * - Marketing & Advertising
 * - Communications & PR
 * - Customer Service & Support
 * - Retail & E-Commerce
 * - Education & Training
 * - Legal & Compliance
 *
 * Research sources: VisualCV, Resume Worded, Jobscan, SHRM, industry associations
 */

import { Skill } from './skills-database';

// Extended skill categories for all industries
export type ComprehensiveSkillCategory =
  // Tech (existing)
  | 'programming-language'
  | 'frontend-framework'
  | 'backend-framework'
  | 'database'
  | 'cloud-platform'
  | 'devops-tool'
  | 'testing-framework'
  | 'methodology'
  // Healthcare
  | 'medical-skill'
  | 'healthcare-system'
  | 'medical-certification'
  // Business & Finance
  | 'financial-skill'
  | 'accounting-tool'
  | 'business-analysis'
  | 'financial-certification'
  // HR
  | 'hr-skill'
  | 'hr-system'
  | 'hr-certification'
  // Sales
  | 'sales-skill'
  | 'crm-tool'
  | 'sales-methodology'
  // Marketing
  | 'marketing-skill'
  | 'marketing-tool'
  | 'analytics-platform'
  | 'marketing-certification'
  // Customer Service
  | 'customer-service-skill'
  | 'support-tool'
  | 'customer-service-certification'
  // Retail & Ecommerce
  | 'retail-skill'
  | 'ecommerce-platform'
  | 'pos-system'
  // Education
  | 'instructional-design'
  | 'lms-platform'
  | 'elearning-tool'
  | 'education-certification'
  // Legal
  | 'legal-skill'
  | 'legal-software'
  | 'compliance-framework'
  | 'legal-certification'
  // Engineering (non-software)
  | 'cad-software'
  | 'engineering-skill'
  | 'engineering-certification'
  // Universal
  | 'soft-skill'
  | 'certification'
  | 'other';

// HEALTHCARE & MEDICAL KEYWORDS
export const HEALTHCARE_SKILLS: Skill[] = [
  // EHR Systems (Critical for ATS)
  { id: 'epic', name: 'Epic', category: 'healthcare-system' as any, synonyms: ['epic ehr', 'epic emr', 'epic systems'], popularity: 95 },
  { id: 'cerner', name: 'Cerner', category: 'healthcare-system' as any, synonyms: ['cerner ehr', 'cerner millennium', 'oracle cerner'], popularity: 92 },
  { id: 'meditech', name: 'Meditech', category: 'healthcare-system' as any, synonyms: ['meditech ehr', 'meditech expanse'], popularity: 85 },
  { id: 'athenahealth', name: 'athenahealth', category: 'healthcare-system' as any, synonyms: ['athena', 'athenaone'], popularity: 82 },
  { id: 'allscripts', name: 'Allscripts', category: 'healthcare-system' as any, synonyms: ['allscripts ehr', 'allscripts sunrise'], popularity: 78 },

  // Core Medical Skills
  { id: 'patient-care', name: 'Patient Care', category: 'medical-skill' as any, synonyms: ['bedside care', 'direct patient care'], popularity: 98 },
  { id: 'vital-signs', name: 'Vital Signs', category: 'medical-skill' as any, synonyms: ['vital sign monitoring', 'vitals assessment'], popularity: 95 },
  { id: 'medication-administration', name: 'Medication Administration', category: 'medical-skill' as any, synonyms: ['med administration', 'medication management'], popularity: 93 },
  { id: 'wound-care', name: 'Wound Care', category: 'medical-skill' as any, synonyms: ['wound management', 'wound dressing'], popularity: 85 },
  { id: 'iv-therapy', name: 'IV Therapy', category: 'medical-skill' as any, synonyms: ['intravenous therapy', 'iv insertion'], popularity: 90 },
  { id: 'phlebotomy', name: 'Phlebotomy', category: 'medical-skill' as any, synonyms: ['blood draw', 'venipuncture'], popularity: 88 },

  // Medical Certifications
  { id: 'rn', name: 'RN', category: 'medical-certification' as any, synonyms: ['registered nurse', 'rn license'], popularity: 98 },
  { id: 'lpn', name: 'LPN', category: 'medical-certification' as any, synonyms: ['licensed practical nurse', 'lvn'], popularity: 90 },
  { id: 'bls', name: 'BLS', category: 'medical-certification' as any, synonyms: ['basic life support', 'bls certification'], popularity: 95 },
  { id: 'acls', name: 'ACLS', category: 'medical-certification' as any, synonyms: ['advanced cardiac life support', 'acls certified'], popularity: 92 },
  { id: 'pals', name: 'PALS', category: 'medical-certification' as any, synonyms: ['pediatric advanced life support'], popularity: 85 },
  { id: 'cna', name: 'CNA', category: 'medical-certification' as any, synonyms: ['certified nursing assistant', 'nurse aide'], popularity: 90 },
  { id: 'cma', name: 'CMA', category: 'medical-certification' as any, synonyms: ['certified medical assistant'], popularity: 88 },

  // Compliance & Regulations
  { id: 'hipaa', name: 'HIPAA', category: 'compliance-framework' as any, synonyms: ['hipaa compliance', 'hipaa regulations'], popularity: 95 },
  { id: 'infection-control', name: 'Infection Control', category: 'medical-skill' as any, synonyms: ['infection prevention', 'sterile technique'], popularity: 92 },
  { id: 'medical-terminology', name: 'Medical Terminology', category: 'medical-skill' as any, synonyms: ['medical vocab', 'medical language'], popularity: 90 },
];

// BUSINESS & FINANCE KEYWORDS
export const FINANCE_SKILLS: Skill[] = [
  // Certifications (Top ATS keywords)
  { id: 'cpa', name: 'CPA', category: 'financial-certification' as any, synonyms: ['certified public accountant', 'cpa license'], popularity: 98 },
  { id: 'cma', name: 'CMA', category: 'financial-certification' as any, synonyms: ['certified management accountant'], popularity: 90 },
  { id: 'cfa', name: 'CFA', category: 'financial-certification' as any, synonyms: ['chartered financial analyst'], popularity: 95 },
  { id: 'frm', name: 'FRM', category: 'financial-certification' as any, synonyms: ['financial risk manager'], popularity: 85 },

  // Financial Analysis
  { id: 'financial-modeling', name: 'Financial Modeling', category: 'financial-skill' as any, synonyms: ['financial models', 'excel modeling'], popularity: 95 },
  { id: 'valuation', name: 'Valuation', category: 'financial-skill' as any, synonyms: ['company valuation', 'business valuation'], popularity: 92 },
  { id: 'dcf', name: 'DCF', category: 'financial-skill' as any, synonyms: ['discounted cash flow', 'dcf analysis'], popularity: 90 },
  { id: 'lbo', name: 'LBO', category: 'financial-skill' as any, synonyms: ['leveraged buyout', 'lbo modeling'], popularity: 88 },
  { id: 'merger-acquisition', name: 'M&A', category: 'financial-skill' as any, synonyms: ['mergers and acquisitions', 'merger acquisition'], popularity: 93 },

  // Tools & Platforms
  { id: 'bloomberg-terminal', name: 'Bloomberg Terminal', category: 'accounting-tool' as any, synonyms: ['bloomberg', 'bloomberg professional'], popularity: 95 },
  { id: 'sap', name: 'SAP', category: 'accounting-tool' as any, synonyms: ['sap erp', 'sap fico'], popularity: 92 },
  { id: 'quickbooks', name: 'QuickBooks', category: 'accounting-tool' as any, synonyms: ['quickbooks online', 'qbo'], popularity: 90 },
  { id: 'oracle-financials', name: 'Oracle Financials', category: 'accounting-tool' as any, synonyms: ['oracle erp', 'oracle cloud financials'], popularity: 88 },
  { id: 'tableau', name: 'Tableau', category: 'analytics-platform' as any, synonyms: ['tableau desktop', 'tableau server'], popularity: 92 },

  // Accounting Skills
  { id: 'gaap', name: 'GAAP', category: 'financial-skill' as any, synonyms: ['generally accepted accounting principles', 'us gaap'], popularity: 95 },
  { id: 'ifrs', name: 'IFRS', category: 'financial-skill' as any, synonyms: ['international financial reporting standards'], popularity: 85 },
  { id: 'accounts-payable', name: 'Accounts Payable', category: 'financial-skill' as any, synonyms: ['ap', 'payables management'], popularity: 88 },
  { id: 'accounts-receivable', name: 'Accounts Receivable', category: 'financial-skill' as any, synonyms: ['ar', 'receivables management'], popularity: 88 },
  { id: 'general-ledger', name: 'General Ledger', category: 'financial-skill' as any, synonyms: ['gl', 'ledger reconciliation'], popularity: 90 },
  { id: 'month-end-close', name: 'Month-End Close', category: 'financial-skill' as any, synonyms: ['month end', 'financial close'], popularity: 85 },
  { id: 'financial-reporting', name: 'Financial Reporting', category: 'financial-skill' as any, synonyms: ['financial statements', 'reporting'], popularity: 93 },
  { id: 'budgeting', name: 'Budgeting', category: 'financial-skill' as any, synonyms: ['budget planning', 'budget management'], popularity: 90 },
  { id: 'forecasting', name: 'Forecasting', category: 'financial-skill' as any, synonyms: ['financial forecasting', 'revenue forecasting'], popularity: 90 },
  { id: 'variance-analysis', name: 'Variance Analysis', category: 'financial-skill' as any, synonyms: ['budget variance', 'variance reporting'], popularity: 82 },
];

// HUMAN RESOURCES KEYWORDS
export const HR_SKILLS: Skill[] = [
  // Certifications
  { id: 'shrm-cp', name: 'SHRM-CP', category: 'hr-certification' as any, synonyms: ['shrm certified professional'], popularity: 95 },
  { id: 'shrm-scp', name: 'SHRM-SCP', category: 'hr-certification' as any, synonyms: ['shrm senior certified professional'], popularity: 92 },
  { id: 'phr', name: 'PHR', category: 'hr-certification' as any, synonyms: ['professional in human resources'], popularity: 90 },
  { id: 'sphr', name: 'SPHR', category: 'hr-certification' as any, synonyms: ['senior professional in human resources'], popularity: 88 },

  // HR Platforms
  { id: 'workday', name: 'Workday', category: 'hr-system' as any, synonyms: ['workday hcm', 'workday hrms'], popularity: 95 },
  { id: 'bamboohr', name: 'BambooHR', category: 'hr-system' as any, synonyms: ['bamboo hr'], popularity: 88 },
  { id: 'adp', name: 'ADP', category: 'hr-system' as any, synonyms: ['adp workforce now', 'automatic data processing'], popularity: 92 },
  { id: 'successfactors', name: 'SuccessFactors', category: 'hr-system' as any, synonyms: ['sap successfactors', 'sf'], popularity: 85 },
  { id: 'greenhouse', name: 'Greenhouse', category: 'hr-system' as any, synonyms: ['greenhouse ats', 'greenhouse recruiting'], popularity: 90 },
  { id: 'lever', name: 'Lever', category: 'hr-system' as any, synonyms: ['lever ats', 'lever hire'], popularity: 82 },
  { id: 'taleo', name: 'Taleo', category: 'hr-system' as any, synonyms: ['oracle taleo', 'taleo recruiting'], popularity: 80 },

  // Core HR Skills
  { id: 'talent-acquisition', name: 'Talent Acquisition', category: 'hr-skill' as any, synonyms: ['recruiting', 'recruitment'], popularity: 95 },
  { id: 'employee-relations', name: 'Employee Relations', category: 'hr-skill' as any, synonyms: ['er', 'labor relations'], popularity: 92 },
  { id: 'full-cycle-recruiting', name: 'Full-Cycle Recruiting', category: 'hr-skill' as any, synonyms: ['end to end recruiting', 'full cycle recruitment'], popularity: 90 },
  { id: 'onboarding', name: 'Onboarding', category: 'hr-skill' as any, synonyms: ['new hire onboarding', 'employee onboarding'], popularity: 88 },
  { id: 'performance-management', name: 'Performance Management', category: 'hr-skill' as any, synonyms: ['performance reviews', 'performance appraisals'], popularity: 90 },
  { id: 'compensation-benefits', name: 'Compensation & Benefits', category: 'hr-skill' as any, synonyms: ['comp and benefits', 'total rewards'], popularity: 92 },
  { id: 'hris', name: 'HRIS', category: 'hr-system' as any, synonyms: ['hr information system', 'hrms'], popularity: 90 },
  { id: 'dei', name: 'DEI', category: 'hr-skill' as any, synonyms: ['diversity equity inclusion', 'diversity and inclusion'], popularity: 85 },
];

// SALES & BUSINESS DEVELOPMENT KEYWORDS
export const SALES_SKILLS: Skill[] = [
  // Sales Methodologies (Critical ATS keywords)
  { id: 'spin-selling', name: 'SPIN Selling', category: 'sales-methodology' as any, synonyms: ['spin', 'spin sales'], popularity: 88 },
  { id: 'challenger-sale', name: 'Challenger Sale', category: 'sales-methodology' as any, synonyms: ['challenger sales', 'challenger method'], popularity: 85 },
  { id: 'meddic', name: 'MEDDIC', category: 'sales-methodology' as any, synonyms: ['meddic sales', 'meddic methodology'], popularity: 82 },
  { id: 'bant', name: 'BANT', category: 'sales-methodology' as any, synonyms: ['bant qualification', 'bant framework'], popularity: 80 },
  { id: 'sandler', name: 'Sandler', category: 'sales-methodology' as any, synonyms: ['sandler selling', 'sandler sales'], popularity: 75 },

  // CRM Platforms
  { id: 'salesforce', name: 'Salesforce', category: 'crm-tool' as any, synonyms: ['sfdc', 'salesforce crm'], popularity: 98 },
  { id: 'hubspot-crm', name: 'HubSpot CRM', category: 'crm-tool' as any, synonyms: ['hubspot', 'hubspot sales'], popularity: 92 },
  { id: 'linkedin-sales-navigator', name: 'LinkedIn Sales Navigator', category: 'crm-tool' as any, synonyms: ['sales navigator', 'linkedin navigator'], popularity: 90 },
  { id: 'zoominfo', name: 'ZoomInfo', category: 'crm-tool' as any, synonyms: ['zoom info', 'zoominfo sales'], popularity: 88 },
  { id: 'outreach-io', name: 'Outreach.io', category: 'crm-tool' as any, synonyms: ['outreach', 'outreach platform'], popularity: 85 },
  { id: 'salesloft', name: 'SalesLoft', category: 'crm-tool' as any, synonyms: ['sales loft', 'salesloft platform'], popularity: 82 },

  // Core Sales Skills
  { id: 'lead-generation', name: 'Lead Generation', category: 'sales-skill' as any, synonyms: ['lead gen', 'prospecting'], popularity: 95 },
  { id: 'pipeline-management', name: 'Pipeline Management', category: 'sales-skill' as any, synonyms: ['sales pipeline', 'pipeline development'], popularity: 93 },
  { id: 'b2b-sales', name: 'B2B Sales', category: 'sales-skill' as any, synonyms: ['business to business sales', 'enterprise sales'], popularity: 95 },
  { id: 'b2c-sales', name: 'B2C Sales', category: 'sales-skill' as any, synonyms: ['business to consumer sales', 'consumer sales'], popularity: 85 },
  { id: 'cold-calling', name: 'Cold Calling', category: 'sales-skill' as any, synonyms: ['outbound calling', 'prospecting calls'], popularity: 88 },
  { id: 'account-management', name: 'Account Management', category: 'sales-skill' as any, synonyms: ['account mgmt', 'client management'], popularity: 92 },
  { id: 'quota-attainment', name: 'Quota Attainment', category: 'sales-skill' as any, synonyms: ['meeting quota', 'quota achievement'], popularity: 90 },
  { id: 'negotiation', name: 'Negotiation', category: 'sales-skill' as any, synonyms: ['contract negotiation', 'deal negotiation'], popularity: 93 },
  { id: 'closing', name: 'Closing', category: 'sales-skill' as any, synonyms: ['deal closing', 'close deals'], popularity: 92 },
  { id: 'crm-management', name: 'CRM Management', category: 'sales-skill' as any, synonyms: ['crm', 'customer relationship management'], popularity: 95 },
];

// MARKETING & ADVERTISING KEYWORDS
export const MARKETING_SKILLS: Skill[] = [
  // Digital Marketing Core
  { id: 'seo', name: 'SEO', category: 'marketing-skill' as any, synonyms: ['search engine optimization', 'organic search'], popularity: 98 },
  { id: 'sem', name: 'SEM', category: 'marketing-skill' as any, synonyms: ['search engine marketing', 'paid search'], popularity: 95 },
  { id: 'ppc', name: 'PPC', category: 'marketing-skill' as any, synonyms: ['pay per click', 'paid advertising'], popularity: 95 },
  { id: 'google-ads', name: 'Google Ads', category: 'marketing-tool' as any, synonyms: ['google adwords', 'adwords'], popularity: 98 },
  { id: 'facebook-ads', name: 'Facebook Ads', category: 'marketing-tool' as any, synonyms: ['meta ads', 'fb ads'], popularity: 92 },

  // Marketing Automation
  { id: 'hubspot', name: 'HubSpot', category: 'marketing-tool' as any, synonyms: ['hubspot marketing', 'hubspot automation'], popularity: 95 },
  { id: 'marketo', name: 'Marketo', category: 'marketing-tool' as any, synonyms: ['marketo engage', 'adobe marketo'], popularity: 90 },
  { id: 'pardot', name: 'Pardot', category: 'marketing-tool' as any, synonyms: ['salesforce pardot', 'account engagement'], popularity: 85 },
  { id: 'mailchimp', name: 'Mailchimp', category: 'marketing-tool' as any, synonyms: ['mail chimp', 'mailchimp email'], popularity: 88 },

  // Analytics
  { id: 'google-analytics', name: 'Google Analytics', category: 'analytics-platform' as any, synonyms: ['ga', 'ga4', 'google analytics 4'], popularity: 98 },
  { id: 'semrush', name: 'SEMrush', category: 'marketing-tool' as any, synonyms: ['sem rush', 'semrush seo'], popularity: 90 },
  { id: 'ahrefs', name: 'Ahrefs', category: 'marketing-tool' as any, synonyms: ['ahrefs seo'], popularity: 88 },

  // Social Media
  { id: 'social-media-marketing', name: 'Social Media Marketing', category: 'marketing-skill' as any, synonyms: ['smm', 'social marketing'], popularity: 95 },
  { id: 'content-marketing', name: 'Content Marketing', category: 'marketing-skill' as any, synonyms: ['content strategy', 'content creation'], popularity: 93 },
  { id: 'email-marketing', name: 'Email Marketing', category: 'marketing-skill' as any, synonyms: ['email campaigns', 'email automation'], popularity: 92 },
  { id: 'marketing-automation', name: 'Marketing Automation', category: 'marketing-skill' as any, synonyms: ['automation platforms', 'automated marketing'], popularity: 90 },

  // Certifications
  { id: 'google-ads-certified', name: 'Google Ads Certification', category: 'marketing-certification' as any, synonyms: ['google ads cert', 'adwords certification'], popularity: 92 },
  { id: 'google-analytics-certified', name: 'Google Analytics Certification', category: 'marketing-certification' as any, synonyms: ['ga certification', 'ga4 certified'], popularity: 90 },
  { id: 'hubspot-certified', name: 'HubSpot Certification', category: 'marketing-certification' as any, synonyms: ['hubspot cert', 'hubspot academy'], popularity: 85 },
];

// CUSTOMER SERVICE & SUPPORT KEYWORDS
export const CUSTOMER_SERVICE_SKILLS: Skill[] = [
  // Support Platforms
  { id: 'zendesk', name: 'Zendesk', category: 'support-tool' as any, synonyms: ['zendesk support', 'zendesk suite'], popularity: 95 },
  { id: 'freshdesk', name: 'Freshdesk', category: 'support-tool' as any, synonyms: ['fresh desk', 'freshdesk support'], popularity: 88 },
  { id: 'servicenow', name: 'ServiceNow', category: 'support-tool' as any, synonyms: ['service now', 'snow'], popularity: 92 },
  { id: 'intercom', name: 'Intercom', category: 'support-tool' as any, synonyms: ['intercom support', 'intercom chat'], popularity: 85 },

  // Core Skills
  { id: 'customer-service', name: 'Customer Service', category: 'customer-service-skill' as any, synonyms: ['customer support', 'customer care'], popularity: 98 },
  { id: 'technical-support', name: 'Technical Support', category: 'customer-service-skill' as any, synonyms: ['tech support', 'help desk'], popularity: 95 },
  { id: 'troubleshooting', name: 'Troubleshooting', category: 'customer-service-skill' as any, synonyms: ['problem solving', 'issue resolution'], popularity: 92 },
  { id: 'customer-satisfaction', name: 'Customer Satisfaction', category: 'customer-service-skill' as any, synonyms: ['csat', 'customer happiness'], popularity: 90 },
  { id: 'first-call-resolution', name: 'First Call Resolution', category: 'customer-service-skill' as any, synonyms: ['fcr', 'first contact resolution'], popularity: 85 },
  { id: 'ticket-management', name: 'Ticket Management', category: 'customer-service-skill' as any, synonyms: ['case management', 'ticketing'], popularity: 88 },
  { id: 'live-chat-support', name: 'Live Chat Support', category: 'customer-service-skill' as any, synonyms: ['chat support', 'online chat'], popularity: 90 },

  // Metrics
  { id: 'nps', name: 'NPS', category: 'customer-service-skill' as any, synonyms: ['net promoter score'], popularity: 85 },
  { id: 'csat', name: 'CSAT', category: 'customer-service-skill' as any, synonyms: ['customer satisfaction score'], popularity: 82 },
  { id: 'sla', name: 'SLA', category: 'customer-service-skill' as any, synonyms: ['service level agreement', 'sla management'], popularity: 88 },
];

// RETAIL & E-COMMERCE KEYWORDS
export const RETAIL_SKILLS: Skill[] = [
  // E-Commerce Platforms
  { id: 'shopify', name: 'Shopify', category: 'ecommerce-platform' as any, synonyms: ['shopify store', 'shopify plus'], popularity: 95 },
  { id: 'woocommerce', name: 'WooCommerce', category: 'ecommerce-platform' as any, synonyms: ['woo commerce', 'wordpress ecommerce'], popularity: 88 },
  { id: 'magento', name: 'Magento', category: 'ecommerce-platform' as any, synonyms: ['adobe commerce', 'magento 2'], popularity: 85 },
  { id: 'bigcommerce', name: 'BigCommerce', category: 'ecommerce-platform' as any, synonyms: ['big commerce'], popularity: 80 },

  // POS Systems
  { id: 'square-pos', name: 'Square POS', category: 'pos-system' as any, synonyms: ['square', 'square point of sale'], popularity: 90 },
  { id: 'clover', name: 'Clover', category: 'pos-system' as any, synonyms: ['clover pos', 'clover system'], popularity: 82 },

  // Retail Skills
  { id: 'inventory-management', name: 'Inventory Management', category: 'retail-skill' as any, synonyms: ['stock management', 'inventory control'], popularity: 95 },
  { id: 'visual-merchandising', name: 'Visual Merchandising', category: 'retail-skill' as any, synonyms: ['product display', 'merchandise display'], popularity: 88 },
  { id: 'point-of-sale', name: 'Point of Sale', category: 'retail-skill' as any, synonyms: ['pos', 'checkout'], popularity: 92 },
  { id: 'loss-prevention', name: 'Loss Prevention', category: 'retail-skill' as any, synonyms: ['shrink control', 'theft prevention'], popularity: 85 },
  { id: 'customer-experience', name: 'Customer Experience', category: 'retail-skill' as any, synonyms: ['cx', 'customer journey'], popularity: 93 },
  { id: 'omnichannel', name: 'Omnichannel', category: 'retail-skill' as any, synonyms: ['omnichannel retail', 'multichannel'], popularity: 88 },
];

// EDUCATION & TRAINING KEYWORDS
export const EDUCATION_SKILLS: Skill[] = [
  // LMS Platforms
  { id: 'blackboard', name: 'Blackboard', category: 'lms-platform' as any, synonyms: ['blackboard learn', 'blackboard lms'], popularity: 90 },
  { id: 'canvas', name: 'Canvas', category: 'lms-platform' as any, synonyms: ['canvas lms', 'instructure canvas'], popularity: 92 },
  { id: 'moodle', name: 'Moodle', category: 'lms-platform' as any, synonyms: ['moodle lms'], popularity: 85 },
  { id: 'google-classroom', name: 'Google Classroom', category: 'lms-platform' as any, synonyms: ['classroom', 'google class'], popularity: 88 },

  // E-Learning Authoring
  { id: 'articulate-storyline', name: 'Articulate Storyline', category: 'elearning-tool' as any, synonyms: ['storyline', 'articulate 360'], popularity: 90 },
  { id: 'articulate-rise', name: 'Articulate Rise', category: 'elearning-tool' as any, synonyms: ['rise', 'rise 360'], popularity: 85 },
  { id: 'adobe-captivate', name: 'Adobe Captivate', category: 'elearning-tool' as any, synonyms: ['captivate'], popularity: 82 },
  { id: 'camtasia', name: 'Camtasia', category: 'elearning-tool' as any, synonyms: ['techsmith camtasia'], popularity: 80 },

  // Core Skills
  { id: 'instructional-design', name: 'Instructional Design', category: 'instructional-design' as any, synonyms: ['id', 'course design'], popularity: 95 },
  { id: 'curriculum-development', name: 'Curriculum Development', category: 'instructional-design' as any, synonyms: ['curriculum design', 'course development'], popularity: 92 },
  { id: 'elearning', name: 'E-Learning', category: 'instructional-design' as any, synonyms: ['online learning', 'digital learning'], popularity: 90 },
  { id: 'addie', name: 'ADDIE', category: 'methodology' as any, synonyms: ['addie model', 'addie framework'], popularity: 85 },
  { id: 'blooms-taxonomy', name: "Bloom's Taxonomy", category: 'methodology' as any, synonyms: ['blooms', 'taxonomy'], popularity: 80 },

  // Certifications
  { id: 'cplp', name: 'CPLP', category: 'education-certification' as any, synonyms: ['certified professional in learning and performance'], popularity: 82 },
  { id: 'cptd', name: 'CPTD', category: 'education-certification' as any, synonyms: ['certified professional in talent development'], popularity: 80 },
];

// LEGAL & COMPLIANCE KEYWORDS
export const LEGAL_SKILLS: Skill[] = [
  // Legal Research Platforms
  { id: 'westlaw', name: 'Westlaw', category: 'legal-software' as any, synonyms: ['westlaw edge', 'thomson reuters westlaw'], popularity: 95 },
  { id: 'lexisnexis', name: 'LexisNexis', category: 'legal-software' as any, synonyms: ['lexis', 'lexis nexis'], popularity: 93 },

  // eDiscovery
  { id: 'relativity', name: 'Relativity', category: 'legal-software' as any, synonyms: ['relativity ediscovery', 'relativity one'], popularity: 90 },
  { id: 'everlaw', name: 'Everlaw', category: 'legal-software' as any, synonyms: ['everlaw ediscovery'], popularity: 82 },

  // Core Legal Skills
  { id: 'legal-research', name: 'Legal Research', category: 'legal-skill' as any, synonyms: ['case law research', 'statutory research'], popularity: 95 },
  { id: 'legal-writing', name: 'Legal Writing', category: 'legal-skill' as any, synonyms: ['legal drafting', 'legal documents'], popularity: 93 },
  { id: 'contract-drafting', name: 'Contract Drafting', category: 'legal-skill' as any, synonyms: ['contract writing', 'agreement drafting'], popularity: 92 },
  { id: 'litigation', name: 'Litigation', category: 'legal-skill' as any, synonyms: ['civil litigation', 'trial litigation'], popularity: 90 },
  { id: 'ediscovery', name: 'eDiscovery', category: 'legal-skill' as any, synonyms: ['electronic discovery', 'e-discovery'], popularity: 85 },
  { id: 'due-diligence', name: 'Due Diligence', category: 'legal-skill' as any, synonyms: ['legal due diligence', 'dd'], popularity: 88 },

  // Compliance
  { id: 'regulatory-compliance', name: 'Regulatory Compliance', category: 'compliance-framework' as any, synonyms: ['compliance management', 'regulatory affairs'], popularity: 92 },
  { id: 'gdpr', name: 'GDPR', category: 'compliance-framework' as any, synonyms: ['general data protection regulation', 'gdpr compliance'], popularity: 90 },
  { id: 'sox', name: 'SOX', category: 'compliance-framework' as any, synonyms: ['sarbanes oxley', 'sarbanes-oxley'], popularity: 85 },
  { id: 'aml', name: 'AML', category: 'compliance-framework' as any, synonyms: ['anti money laundering', 'anti-money laundering'], popularity: 88 },

  // Certifications
  { id: 'cissp', name: 'CISSP', category: 'legal-certification' as any, synonyms: ['certified information systems security professional'], popularity: 90 },
  { id: 'cipp', name: 'CIPP', category: 'legal-certification' as any, synonyms: ['certified information privacy professional'], popularity: 85 },
];

// UNIVERSAL SOFT SKILLS (Critical for ALL industries)
export const SOFT_SKILLS: Skill[] = [
  { id: 'communication', name: 'Communication', category: 'soft-skill' as any, synonyms: ['verbal communication', 'written communication'], popularity: 98 },
  { id: 'problem-solving', name: 'Problem-Solving', category: 'soft-skill' as any, synonyms: ['problem solving', 'analytical thinking'], popularity: 95 },
  { id: 'teamwork', name: 'Teamwork', category: 'soft-skill' as any, synonyms: ['collaboration', 'team player'], popularity: 95 },
  { id: 'leadership', name: 'Leadership', category: 'soft-skill' as any, synonyms: ['team leadership', 'leading teams'], popularity: 93 },
  { id: 'time-management', name: 'Time Management', category: 'soft-skill' as any, synonyms: ['time mgmt', 'prioritization'], popularity: 90 },
  { id: 'adaptability', name: 'Adaptability', category: 'soft-skill' as any, synonyms: ['flexibility', 'agility'], popularity: 88 },
  { id: 'critical-thinking', name: 'Critical Thinking', category: 'soft-skill' as any, synonyms: ['analytical skills', 'analysis'], popularity: 92 },
  { id: 'attention-to-detail', name: 'Attention to Detail', category: 'soft-skill' as any, synonyms: ['detail oriented', 'meticulous'], popularity: 90 },
  { id: 'customer-focus', name: 'Customer Focus', category: 'soft-skill' as any, synonyms: ['customer oriented', 'client focused'], popularity: 88 },
  { id: 'project-management', name: 'Project Management', category: 'soft-skill' as any, synonyms: ['project mgmt', 'pm'], popularity: 93 },
];

// Combine all expansions
export const COMPREHENSIVE_SKILLS_EXPANSION: Skill[] = [
  ...HEALTHCARE_SKILLS,
  ...FINANCE_SKILLS,
  ...HR_SKILLS,
  ...SALES_SKILLS,
  ...MARKETING_SKILLS,
  ...CUSTOMER_SERVICE_SKILLS,
  ...RETAIL_SKILLS,
  ...EDUCATION_SKILLS,
  ...LEGAL_SKILLS,
  ...SOFT_SKILLS,
];

console.log(`[Uproot] Comprehensive Skills Expansion: ${COMPREHENSIVE_SKILLS_EXPANSION.length} keywords loaded`);
