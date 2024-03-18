import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { Prof } from 'src/schemas/Prof.schema';
import { Student } from 'src/schemas/Student.schema';
import { User } from 'src/schemas/User.schema';
import * as bcrypt from 'bcrypt';
import { UserDTO } from './DTO/User.dto';
import { StudentDTO } from './DTO/Student.dto';
import { ProfDTO } from './DTO/Prof.dto';
import {
  TransactionalEmailsApi,
  SendSmtpEmail,
  TransactionalEmailsApiApiKeys,
} from '@sendinblue/client';

@Injectable()
export class AuthService {
  private sendinblue: TransactionalEmailsApi;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Student.name) private readonly studentModel: Model<Student>,
    @InjectModel(Prof.name) private readonly profModel: Model<Prof>,
    private readonly jwtService: JwtService,
  ) {
    // Configure API key authorization: apiKey
    const apiInstance = new TransactionalEmailsApi();
    apiInstance.setApiKey(
      TransactionalEmailsApiApiKeys.apiKey,
      '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',
    );
    this.sendinblue = apiInstance;
  }

  //prof signup
  async signupProf(createUserDto: UserDTO, userData: ProfDTO): Promise<any> {
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = new this.userModel({
      email: createUserDto.email,
      password: hashedPassword,
      role: 'prof',
    });
    await user.save();

    const prof = new this.profModel({ ...userData, user: user._id });
    await prof.save();

    const token = this.jwtService.sign({ email: user.email, id: user.id });
    const tokenUrl = `${process.env.BASE_URL}/activate?token=${token}`;

    try {
      await this.sendActivationEmail(createUserDto.email, tokenUrl);
   
    } catch (error) {
      console.error('Error sending activation email:', error);
    }
    return { prof };
  }

  //student signup
  async signupStudent(
    createUserDto: UserDTO,
    userData: StudentDTO,
  ): Promise<any> {
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = new this.userModel({
      email: createUserDto.email,
      password: hashedPassword,
      role: createUserDto.role,
    });
    await user.save();

    const student = new this.studentModel({ ...userData, user: user._id });
    await student.save();
    const token = this.jwtService.sign({ email: user.email, id: user.id });
    const tokenUrl = `${process.env.BASE_URL}/verify/activate?token=${token}`;

    try {
      await this.sendActivationEmail(createUserDto.email, tokenUrl);
  
    } catch (error) {
      console.error('Error sending activation email:', error);
    }
    return { student};
  }

  //user login
  async login(email: string, password: string): Promise<string> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User doesnt exist!');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    return this.jwtService.sign({ email: user.email, id: user.id });
  }

  //decode token for get user
  decodeToken(token: string) {
    return this.jwtService.decode(token);
  }
// very user role
  async verifyUserRole(id: string, role: string): Promise<boolean> {
    const user = await this.userModel.findById(id);
    return user.role == role;
  }
// send activation email 
  async sendActivationEmail(email: string, tokenUrl: string): Promise<any> {
    const templateId: number = parseInt('1');

    const message: SendSmtpEmail = new SendSmtpEmail();
    message.sender = { email: 'm.yahiaoui@esi-sba.dz', name: 'meriem' };
    message.to = [{ email }];
    message.templateId = templateId;
    message.params = { activationUrl: tokenUrl };

    let result;
    try {
      result = await this.sendinblue.sendTransacEmail(message);
    } catch (error) {
      console.log(error.message);
    }
    return result;
  }

// verify user account after sending the email
  async verifyUser(token: string): Promise<any> {
    const decodedToken = this.jwtService.verify(token);
    const userId = decodedToken.id;

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isValid = true;
    await user.save();

    return { message: 'User verified successfully' };
  }
}