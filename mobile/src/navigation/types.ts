export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Landing: undefined;
  Login: undefined;
  SignUp: undefined;
  TermsOfService: undefined;
};

export type MainStackParamList = {
  HomeSelection: undefined;
  HomeDashboard: { home: any }; // Home object passed as parameter
  SecuritySettings: { home: any }; // Home object passed as parameter
  AppSettings: undefined;
  Profile: undefined;
  Settings: undefined;
  // Home Management
  HomeList: undefined; // List of homes
  MemberManagement: { home: any }; // Manage specific home members (invite users, add people)
  ManagePeople: { home: any }; // Manage people for a specific home
  RecentActivities: { home: any }; // Recent activities for a specific home
  GlobalActivities: undefined; // Global activities from all homes
  // Device Management
  DeviceManagement: { home: any };
  AllHomesDevices: undefined; // All devices across all homes
  // Requests
  QueuedRequests: undefined; // Queued access requests
  // Security Controls
  DeadboltControl: { home: any };
  FaceDetection: { home: any };
  RFIDManagement: { home: any };
  AccessLogs: { home: any };
  // Add more main app screens here as you develop them
};

// Navigation prop types
export type AuthScreenProps<T extends keyof AuthStackParamList> = {
  navigation: any; // We'll improve this with proper typing later
  route: {
    params: AuthStackParamList[T];
  };
};

export type MainScreenProps<T extends keyof MainStackParamList> = {
  navigation: any; // We'll improve this with proper typing later
  route: {
    params: MainStackParamList[T];
  };
};
