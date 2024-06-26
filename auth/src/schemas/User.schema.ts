
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';


@Schema()
export class User {
  @Prop({unique:true,required:true})
  email: string;

  @Prop({required:true})
  password: string;
  
  @Prop({default:"student"})
  role: string;
  
  @Prop({default:false})
  isValid: boolean;

  @Prop({default:false})
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);