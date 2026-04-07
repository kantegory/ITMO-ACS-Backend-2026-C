import "@typespec/http";


using TypeSpec.Http;

@service(#{
  title: "Message Service - Internal API"
})
@server("http://message-service:8005/internal")
@useAuth(BearerAuth)
@tag("Messages")
namespace MessageService.Internal;

alias BearerAuth = Http.BearerAuth;

enum MessageType {
  text,
  image,
  file,
}

model MessageReference {
  id: int32;
  sender_id: int32;
  receiver_id: int32;
  accom_id?: int32;
  mes_text: string;
  mes_type: MessageType;
  is_read: boolean;
  created_at: utcDateTime;
}

model MessageIds {
  ids: int32[];
}

model MessageList {
  messages: MessageReference[];
}

model SendMessageRequest {
  sender_id: int32;
  receiver_id: int32;
  accom_id?: int32;
  mes_text: string;

  mes_type: MessageType;
}

model SendMessageResponse {
  message: MessageReference;
  success: boolean;
}

model ConversationRequest {
  user1_id: int32;
  user2_id: int32;
  accom_id?: int32;
  limit: int32;
  offset: int32;
}

model ConversationResponse {
  messages: MessageReference[];
  total: int32;
  participants: {
    user1: int32;
    user2: int32;
  };
}

model UnreadCountResponse {
  count: int32;
}

model ErrorResponse {
  status: int32;
  message: string;
  timestamp: utcDateTime;
}

@route("/messages")
interface Messages {
  @get
  @route("/batch")
  batchGetMessages(
    @body body: MessageIds
  ): {
    @statusCode _: 200;
    @body body: MessageList;
  } | {
    @statusCode _: 401;
    @body body: ErrorResponse;
  };

  @get
  @route("/{id}")
  getMessage(
    @path id: int32
  ): {
    @statusCode _: 200;
    @body body: MessageReference;
  } | {
    @statusCode _: 404;
    @body body: ErrorResponse;
  };

  @post
  @route("")
  sendMessage(
    @body body: SendMessageRequest
  ): {
    @statusCode _: 201;
    @body body: SendMessageResponse;
  } | {
    @statusCode _: 400;
    @body body: ErrorResponse;
  };

  @get
  @route("/conversation")
  getConversation(
    @body body: ConversationRequest
  ): {
    @statusCode _: 200;
    @body body: ConversationResponse;
  };

  @get
  @route("/accommodation/{accomId}")
  getMessagesByAccommodation(
    @path accomId: int32,
    @query limit?: int32 = 100
  ): {
    @statusCode _: 200;
    @body body: MessageList;
  };

}