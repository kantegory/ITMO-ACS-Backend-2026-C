export class CreateRatingDto {
  userId: number;
  recipeId: number;
  value: 'OPTIONAL' | 'GOOD' | 'AMAZING';
}