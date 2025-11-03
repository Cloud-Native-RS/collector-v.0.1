import { Carrier } from '@prisma/client';
import { BaseCarrier } from './base-carrier';
import { DHLCarrier } from './dhl-carrier';
import { UPSCarrier } from './ups-carrier';
import { GLSCarrier } from './gls-carrier';
import { GenericCarrier } from './generic-carrier';

export class CarrierFactory {
  static create(carrier: Carrier): BaseCarrier {
    const name = carrier.name.toLowerCase();

    if (name.includes('dhl')) {
      return new DHLCarrier(carrier);
    } else if (name.includes('ups')) {
      return new UPSCarrier(carrier);
    } else if (name.includes('gls')) {
      return new GLSCarrier(carrier);
    } else {
      return new GenericCarrier(carrier);
    }
  }
}

