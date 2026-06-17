export type Locale = 'en' | 'ko';

export const translations = {
  en: {
    nav: {
      brand: 'Roamer',
      joinBeta: 'Join Beta',
      langToggle: 'KO',
    },
    hero: {
      badge: 'Now in Closed Beta',
      titleLine1: 'How many streets have you',
      titleHighlight: 'discovered?',
      subtitle:
        'Stop running the same routes. Explore new streets, discover hidden corners of your city, and turn every run into an adventure.',
      ctaPrimary: 'Join the Beta',
      ctaSecondary: '▶ Watch Demo',
      note: 'No account required · Runs stay on your device',
      scrollLabel: 'Explore',
    },
    problem: {
      label: 'The Problem',
      heading: 'Running the same route gets boring.',
      body: [
        'Most running apps focus on speed, distance, and performance.',
        'But after a while, many runners find themselves repeating the same streets over and over again.',
        'The city becomes invisible.',
      ],
      conclusion: 'Roamer was built to make running feel exciting again.',
    },
    howItWorks: {
      label: 'How It Works',
      heading: 'Three steps to your next adventure.',
      steps: [
        {
          title: 'Generate',
          description:
            'Choose a distance and generate a unique random route — a new path every time.',
        },
        {
          title: 'Explore',
          description:
            "Follow voice-guided navigation through unfamiliar streets you've never run before.",
        },
        {
          title: 'Discover',
          description:
            'Unlock new streets, earn badges, and build your personal exploration map of the city.',
        },
      ],
      cta: 'Get Early Access',
    },
    whyDifferent: {
      label: 'Why Roamer',
      heading: 'A different kind of running app.',
      traditionalLabel: 'Traditional Running Apps',
      roamerLabel: 'Roamer',
      traditional: ['Distance & Pace', 'Performance Metrics', 'Speed Records', 'Competition'],
      roamer: ['Streets Discovered', 'City Exploration', 'New Adventures', 'Personal Discovery'],
      privacyTitle: 'Privacy-first by design',
      privacyDesc:
        'No social tracking. No unnecessary accounts. Your exploration stays on your device.',
    },
    discoveryConcept: {
      label: 'The Concept',
      heading: 'Every run uncovers something new.',
      subtitle:
        "Roamer generates unique routes and tracks the streets you've never explored before.",
      otherLabel: 'Other apps ask',
      otherQuestion: 'How fast did you run?',
      roamerLabel: 'Roamer asks',
      roamerQuestion: 'How many new streets did you discover today?',
    },
    statsShowcase: {
      subtitle: 'Every run adds to your exploration map',
      stats: [
        { label: 'New Streets Discovered', sub: "from today's run" },
        { label: 'Streets Explored', sub: 'total in your city' },
        { label: 'Explorer Badge Earned', sub: '25+ streets milestone' },
        { label: 'Urban Nomad Progress', sub: 'next badge at 100 streets' },
      ],
    },
    screenshots: {
      label: 'The App',
      heading: 'Built for the streets.',
      screens: ['Route Generation', 'Navigation', 'Street Discovery', 'Trail'],
    },
    whatsComing: {
      label: "What's Coming",
      heading: 'The exploration is just beginning.',
      subtitle: 'Beta users help shape the future of Roamer.',
      features: [
        {
          title: 'Discovery Heatmap',
          desc: "Visualize every street you've ever explored across your entire city.",
        },
        {
          title: 'Monthly Discovery Challenges',
          desc: 'Compete with yourself. Explore a new neighborhood each month.',
        },
        {
          title: 'More Exploration Rewards',
          desc: 'New badges, milestones, and achievements for dedicated explorers.',
        },
        {
          title: 'Shaped by Beta Users',
          desc: 'Your feedback directly influences what gets built next.',
        },
      ],
    },
    founderStory: {
      label: 'The Story',
      heading: 'Built by a runner who got tired of running the same streets.',
      paragraphs: [
        'I was training and realized I was running the same routes every week.',
        "I wanted a way to make running feel fresh again — to actually see my city instead of just getting steps in.",
        'Roamer started with a simple question:',
        'how many streets have I never explored?',
        'Today, it\'s becoming a tool to help runners rediscover their cities, one street at a time.',
      ],
      credit: '— Harry, founder of Roamer',
    },
    waitlist: {
      badge: 'Closed Beta',
      heading: 'Become one of the first explorers.',
      subheading: 'Roamer is currently in closed beta.',
      body: 'Join the waitlist and help shape the future of exploration-focused running.',
      namePlaceholder: 'Your name (optional)',
      emailPlaceholder: 'Your email address',
      submitting: 'Joining...',
      submit: 'Join the Beta',
      error: 'Something went wrong. Please try again.',
      successTitle: "You're on the list!",
      successBody:
        "We'll reach out when your spot is ready. Start planning your first exploration.",
      note: 'No spam. No account required. Unsubscribe anytime.',
    },
    footer: {
      tagline: 'Built with curiosity. Run somewhere new.',
      privacy: 'Privacy Policy',
      contact: 'Contact',
    },
  },

  ko: {
    nav: {
      brand: 'Roamer',
      joinBeta: '베타 참여',
      langToggle: 'EN',
    },
    hero: {
      badge: '클로즈드 베타 진행 중',
      titleLine1: '당신은 얼마나 많은 거리를',
      titleHighlight: '탐험했나요?',
      subtitle:
        '매번 같은 루트만 뛰지 마세요. 새로운 거리를 탐험하고, 도시의 숨겨진 곳을 발견하며, 매 달리기를 모험으로 만드세요.',
      ctaPrimary: '베타 참여하기',
      ctaSecondary: '▶ 데모 보기',
      note: '계정 불필요 · 기록은 내 기기에만 저장',
      scrollLabel: '탐험하기',
    },
    problem: {
      label: '문제점',
      heading: '매번 같은 루트는 지루해집니다.',
      body: [
        '대부분의 러닝 앱은 속도, 거리, 퍼포먼스에만 집중합니다.',
        '하지만 결국 대부분의 러너들은 같은 거리를 반복해서 뛰게 됩니다.',
        '도시가 눈에 들어오지 않게 됩니다.',
      ],
      conclusion: 'Roamer는 달리기를 다시 설레게 만들기 위해 만들어졌습니다.',
    },
    howItWorks: {
      label: '사용 방법',
      heading: '세 단계로 시작하는 새로운 모험.',
      steps: [
        {
          title: '생성',
          description:
            '거리를 선택하고 무작위 루트를 생성하세요 — 매번 새로운 경로가 만들어집니다.',
        },
        {
          title: '탐험',
          description:
            '음성 내비게이션을 따라 한 번도 달려본 적 없는 거리를 탐험하세요.',
        },
        {
          title: '발견',
          description:
            '새로운 거리를 잠금 해제하고, 배지를 획득하며, 나만의 도시 탐험 지도를 만드세요.',
        },
      ],
      cta: '얼리 액세스 신청',
    },
    whyDifferent: {
      label: '왜 Roamer인가',
      heading: '다른 종류의 러닝 앱.',
      traditionalLabel: '일반 러닝 앱',
      roamerLabel: 'Roamer',
      traditional: ['거리 & 페이스', '퍼포먼스 지표', '속도 기록', '경쟁'],
      roamer: ['탐험한 거리', '도시 탐험', '새로운 모험', '나만의 발견'],
      privacyTitle: '처음부터 프라이버시 중심 설계',
      privacyDesc:
        '소셜 추적 없음. 불필요한 계정 없음. 탐험 기록은 내 기기에만 저장됩니다.',
    },
    discoveryConcept: {
      label: '컨셉',
      heading: '달릴 때마다 새로운 것이 보입니다.',
      subtitle:
        'Roamer는 독특한 루트를 생성하고, 한 번도 탐험하지 않은 거리를 추적합니다.',
      otherLabel: '다른 앱들의 질문',
      otherQuestion: '얼마나 빨리 달렸나요?',
      roamerLabel: 'Roamer의 질문',
      roamerQuestion: '오늘 몇 개의 새로운 거리를 발견했나요?',
    },
    statsShowcase: {
      subtitle: '달릴 때마다 탐험 지도가 쌓입니다',
      stats: [
        { label: '오늘 발견한 새 거리', sub: '오늘의 달리기' },
        { label: '탐험한 거리', sub: '도시 누적 총합' },
        { label: '탐험가 배지 획득', sub: '25개 거리 달성' },
        { label: '도시 유목민 진행도', sub: '100개 거리 달성 시 다음 배지' },
      ],
    },
    screenshots: {
      label: '앱 소개',
      heading: '거리를 위해 만들어졌습니다.',
      screens: ['루트 생성', '내비게이션', '거리 발견', '트레일'],
    },
    whatsComing: {
      label: '다음에 올 것들',
      heading: '탐험은 이제 시작입니다.',
      subtitle: '베타 유저가 Roamer의 미래를 만듭니다.',
      features: [
        {
          title: '탐험 히트맵',
          desc: '도시 전체에서 탐험한 모든 거리를 시각화하세요.',
        },
        {
          title: '월간 탐험 챌린지',
          desc: '자신과 경쟁하세요. 매달 새로운 동네를 탐험하세요.',
        },
        {
          title: '더 많은 탐험 보상',
          desc: '헌신적인 탐험가를 위한 새로운 배지, 마일스톤, 업적.',
        },
        {
          title: '베타 유저와 함께 만드는',
          desc: '여러분의 피드백이 다음 개발에 직접 반영됩니다.',
        },
      ],
    },
    founderStory: {
      label: '스토리',
      heading: '같은 거리를 뛰는 것이 지루해진 러너가 만든 앱.',
      paragraphs: [
        '훈련하면서 매주 같은 루트만 뛰고 있다는 것을 깨달았습니다.',
        '달리기를 다시 설레게 만들 방법이 필요했습니다 — 그냥 걸음 수를 채우는 게 아니라 도시를 실제로 보고 싶었습니다.',
        'Roamer는 단순한 질문에서 시작되었습니다:',
        '내가 한 번도 달려본 적 없는 거리는 몇 개나 될까?',
        '오늘날, Roamer는 러너들이 한 번에 한 거리씩 도시를 재발견하도록 돕는 도구가 되고 있습니다.',
      ],
      credit: '— Harry, Roamer 창업자',
    },
    waitlist: {
      badge: '클로즈드 베타',
      heading: '첫 번째 탐험가가 되세요.',
      subheading: 'Roamer는 현재 클로즈드 베타 진행 중입니다.',
      body: '웨이트리스트에 참여해 탐험 중심 러닝의 미래를 함께 만들어 가세요.',
      namePlaceholder: '이름 (선택)',
      emailPlaceholder: '이메일 주소',
      submitting: '참여 중...',
      submit: '베타 참여하기',
      error: '오류가 발생했습니다. 다시 시도해 주세요.',
      successTitle: '등록 완료!',
      successBody:
        '자리가 준비되면 연락드리겠습니다. 첫 번째 탐험을 계획해 보세요.',
      note: '스팸 없음. 계정 불필요. 언제든지 구독 취소 가능.',
    },
    footer: {
      tagline: '호기심으로 만들었습니다. 새로운 곳을 달리세요.',
      privacy: '개인정보처리방침',
      contact: '문의',
    },
  },
} as const;
