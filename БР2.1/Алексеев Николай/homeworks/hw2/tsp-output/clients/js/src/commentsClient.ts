import { type CommentsClientContext, type CommentsClientOptions, createCommentsClientContext } from "./api/commentsClientContext.js";
import { addComment, type AddCommentOptions, deleteComment, type DeleteCommentOptions, listComments, type ListCommentsOptions } from "./api/commentsClientOperations.js";

export class CommentsClient {
  #context: CommentsClientContext
  constructor(endpoint: string, options?: CommentsClientOptions) {
    this.#context = createCommentsClientContext(endpoint, options);

  }
  async listComments(recipeId: number, options?: ListCommentsOptions) {
    return listComments(this.#context, recipeId, options);
  };
  async addComment(
    authorization: string,
    recipeId: number,
    body: {
        text: string;
      },
    options?: AddCommentOptions,
  ) {
    return addComment(this.#context, authorization, recipeId, body, options);
  };
  async deleteComment(
    authorization: string,
    commentId: number,
    options?: DeleteCommentOptions,
  ) {
    return deleteComment(this.#context, authorization, commentId, options);
  }
}
