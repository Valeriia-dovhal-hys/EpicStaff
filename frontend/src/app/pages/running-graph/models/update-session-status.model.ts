export interface SessionStatusMessageData {
  status: string;
  crew_id: number;
  status_data: {
    name: string;
    execution_order: number;
    // If you have more fields, list them here.
  };
  message_type: 'update_session_status';
}
