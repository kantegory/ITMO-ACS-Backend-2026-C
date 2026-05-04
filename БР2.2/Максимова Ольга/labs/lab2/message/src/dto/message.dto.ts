export interface MessageDto {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_name: string;      
  receiver_name: string;  
  content: string;
  accommodation_id?: string;
  created_at: Date;
  updated_at: Date;
}


export interface UserValDTO {
  id: string;
  is_verified: boolean;
}