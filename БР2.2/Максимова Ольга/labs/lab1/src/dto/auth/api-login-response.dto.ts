import { IsString } from 'class-validator';
// import { ApiUser } from '../../controllers/user.controller';
import { ApiUser } from '../user/api-user.dto';

export class ApiLoginResponse {
    @IsString()
    token: string;
    
    user: ApiUser;
}