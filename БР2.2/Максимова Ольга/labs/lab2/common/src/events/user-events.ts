export interface UserCreated {
  eventType: 'user.created';
  first_name: string
  userId: string;
  email: string;
  role: 'user' | 'admin';   
  timestamp: number;
}

export interface UserLoggedIn {
  eventType: 'user.loggedin';
  userId: string;
  email: string;
  timestamp: number;
}


