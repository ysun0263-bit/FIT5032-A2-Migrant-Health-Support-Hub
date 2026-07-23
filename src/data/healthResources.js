export const healthResources = [
  {
    id: 'finding-a-gp',
    title: 'Finding a General Practitioner',
    summary: 'Learn how a GP can support everyday health needs and referrals in Australia.',
    fullDescription:
      'A general practitioner is often the first person to contact for non-emergency health concerns. New migrants may ask a GP about preventive checks, prescriptions, referrals, and ongoing care. This course example explains the pathway in plain language and encourages people to ask for interpreter support when needed.',
    topic: 'Primary Care',
    language: 'English',
    serviceType: 'General Practice',
    audience: 'New arrivals and families',
    relatedServiceIds: ['service-gp-clinic', 'service-interpreter-access'],
    lastUpdated: '2026-07-20',
    featured: true,
    emergencyDisclaimer:
      'This resource is not emergency medical advice. In a life-threatening emergency in Australia, call 000.',
  },
  {
    id: 'child-vaccination',
    title: 'Child Vaccination Planning',
    summary: 'A friendly overview of vaccine records, school requirements, and clinic questions.',
    fullDescription:
      'Families arriving in Australia may need help understanding child vaccination records and catch-up schedules. This demonstration resource suggests bringing previous records to a clinic and asking a qualified health worker about the next steps.',
    topic: 'Children and Family',
    language: 'English',
    serviceType: 'Community Health Centre',
    audience: 'Parents and carers',
    relatedServiceIds: ['service-community-health', 'service-migrant-family-support'],
    lastUpdated: '2026-07-18',
    featured: false,
    emergencyDisclaimer:
      'For urgent symptoms or serious illness, use official emergency services rather than this website.',
  },
  {
    id: 'womens-health-checks',
    title: "Women's Health Checks",
    summary: 'Plain-language information about preventive checks and culturally safe conversations.',
    fullDescription:
      'Women from migrant communities may want clear information about preventive checks, reproductive health, and privacy during appointments. This example resource encourages choosing a trusted service and asking about interpreter or female practitioner options.',
    topic: "Women's Health",
    language: 'English',
    serviceType: "Women's Health",
    audience: 'Women and gender-diverse users',
    relatedServiceIds: ['service-womens-wellbeing', 'service-interpreter-access'],
    lastUpdated: '2026-07-16',
    featured: true,
    emergencyDisclaimer:
      'This content is general information for coursework and does not replace professional medical advice.',
  },
  {
    id: 'mental-health-support',
    title: 'Mental Health Support Pathways',
    summary: 'Understand common support options for stress, grief, anxiety, and social isolation.',
    fullDescription:
      'Migration can involve stress, uncertainty, family separation, and adjustment challenges. This course example describes possible support pathways such as GPs, counselling, peer groups, and community health services. It avoids diagnosis and encourages help from qualified professionals.',
    topic: 'Mental Health',
    language: 'English',
    serviceType: 'Mental Health Support',
    audience: 'Adults and young people',
    relatedServiceIds: ['service-wellbeing-centre', 'service-community-health'],
    lastUpdated: '2026-07-15',
    featured: true,
    emergencyDisclaimer:
      'If someone is at immediate risk of harm, contact emergency services or a crisis service immediately.',
  },
  {
    id: 'emergency-urgent-care',
    title: 'Emergency and Urgent Care',
    summary: 'Know the difference between emergency care, urgent care, and routine appointments.',
    fullDescription:
      'This resource helps users understand when a situation may need emergency help and when a GP or community service may be more appropriate. It clearly directs life-threatening situations to official emergency services.',
    topic: 'Urgent Care',
    language: 'English',
    serviceType: 'Emergency Guidance',
    audience: 'All users',
    relatedServiceIds: ['service-community-health'],
    lastUpdated: '2026-07-12',
    featured: false,
    emergencyDisclaimer:
      'In a life-threatening emergency in Australia, call 000 immediately.',
  },
  {
    id: 'interpreter-services',
    title: 'Using Interpreter Services',
    summary: 'Prepare for health appointments when you prefer another language.',
    fullDescription:
      'Interpreter support can make health appointments clearer and safer. This example resource explains how users can ask services about language support before an appointment and bring important documents or questions.',
    topic: 'Language Support',
    language: 'English',
    serviceType: 'Interpreter Support',
    audience: 'Users who prefer language support',
    relatedServiceIds: ['service-interpreter-access', 'service-migrant-family-support'],
    lastUpdated: '2026-07-10',
    featured: false,
    emergencyDisclaimer:
      'For emergencies, call 000 and ask for interpreter support if needed.',
  },
  {
    id: 'preventive-health-checks',
    title: 'Preventive Health Checks',
    summary: 'A simple guide to routine checks and questions to ask a health worker.',
    fullDescription:
      'Preventive checks can help people understand their health before problems become serious. This demonstration content encourages users to discuss age, family history, and personal concerns with qualified health professionals.',
    topic: 'Preventive Care',
    language: 'English',
    serviceType: 'Community Health Centre',
    audience: 'Adults and older migrants',
    relatedServiceIds: ['service-community-health', 'service-gp-clinic'],
    lastUpdated: '2026-07-08',
    featured: false,
    emergencyDisclaimer:
      'This resource provides general information only and is not a diagnosis or treatment plan.',
  },
  {
    id: 'pharmacy-medication',
    title: 'Medication and Pharmacy Support',
    summary: 'Understand prescriptions, pharmacists, medicine labels, and safety questions.',
    fullDescription:
      'Medicines can have different names, labels, and instructions across countries. This example resource suggests asking a pharmacist or GP before changing medicines and checking dosage instructions carefully.',
    topic: 'Medication',
    language: 'English',
    serviceType: 'Pharmacy Support',
    audience: 'People using prescriptions or regular medicine',
    relatedServiceIds: ['service-gp-clinic', 'service-interpreter-access'],
    lastUpdated: '2026-07-06',
    featured: false,
    emergencyDisclaimer:
      'For poisoning, severe reactions, or urgent symptoms, contact official emergency or poison information services.',
  },
  {
    id: 'community-health-centres',
    title: 'Community Health Centres',
    summary: 'Discover how community health centres may support care navigation and wellbeing.',
    fullDescription:
      'Community health centres may offer care coordination, health education, family support, and wellbeing programs. This course example helps migrants understand what to ask when contacting a local centre.',
    topic: 'Community Services',
    language: 'English',
    serviceType: 'Community Health Centre',
    audience: 'New arrivals and community volunteers',
    relatedServiceIds: ['service-community-health', 'service-migrant-family-support'],
    lastUpdated: '2026-07-04',
    featured: true,
    emergencyDisclaimer:
      'Community services are not a substitute for urgent medical care in an emergency.',
  },
  {
    id: 'health-costs-medicare',
    title: 'Health Costs and Medicare Basics',
    summary: 'Learn common words around Medicare, fees, bulk billing, and questions to ask.',
    fullDescription:
      'Health costs can be confusing for new arrivals. This demonstration resource explains common terms and encourages users to ask clinics about fees, Medicare eligibility, and payment expectations before appointments.',
    topic: 'Health Costs',
    language: 'English',
    serviceType: 'General Practice',
    audience: 'New arrivals and students',
    relatedServiceIds: ['service-gp-clinic', 'service-migrant-family-support'],
    lastUpdated: '2026-07-02',
    featured: true,
    emergencyDisclaimer:
      'This is general course information only. For individual eligibility or billing advice, contact the relevant service.',
  },
]

export function findResourceById(id) {
  return healthResources.find((resource) => resource.id === id)
}
