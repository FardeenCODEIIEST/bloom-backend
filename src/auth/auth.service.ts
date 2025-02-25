import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';
import { FIREBASE } from '../firebase/firebase-factory';
import { FirebaseServices } from '../firebase/firebase.types';
import { UserAuthDto } from './dto/user-auth.dto';

@Injectable()
export class AuthService {
  constructor(@Inject(FIREBASE) private firebase: FirebaseServices) {}

  public async loginFirebaseUser({ email, password }: UserAuthDto) {
    return await this.firebase.auth.signInWithEmailAndPassword(email, password);
  }

  async parseAuth(header: string): Promise<DecodedIdToken> {
    if (!header.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Unauthorized: auth header not in the required format - should be "Bearer {token}"',
      );
    }

    const idToken = header.split('Bearer ')[1];

    const decodedToken = await this.parseAndValidateToken(idToken);

    return decodedToken;
  }

  private async parseAndValidateToken(token: string): Promise<DecodedIdToken> {
    try {
      const decodedToken = await this.firebase.admin.auth().verifyIdToken(token);

      return decodedToken;
    } catch (err) {
      throw err;
    }
  }

  public async createFirebaseUser(email: string, password: string) {
    const userRecord = await this.firebase.admin.auth().createUser({
      email,
      password,
    });
    return userRecord;
  }

  public async getFirebaseUser(email: string) {
    const userRecord = await this.firebase.admin.auth().getUserByEmail(email);
    return userRecord;
  }

  public async deleteFirebaseUser(firebaseUid: string) {
    try {
      await this.firebase.admin.auth().deleteUser(firebaseUid);
      return 'ok';
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
