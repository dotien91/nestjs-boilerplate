import { TftTrait } from '../../../../domain/tft-trait';
import { TftTraitSchemaClass } from '../entities/tft-trait.schema';

export class TftTraitMapper {
  /**
   * Generate icon URL from CDN based on trait name
   */
  private static generateIconUrl(apiName: string, name: string): string {
    // Extract trait name from apiName (e.g., TFT16_Longshot -> longshot)
    // or use name directly
    const traitName = apiName
      ? apiName.replace(/^TFT\d+_/, '').toLowerCase()
      : name.toLowerCase();
    
    return `https://cdn.metatft.com/file/metatft/traits/${traitName}.png`;
  }

  static toDomain(raw: TftTraitSchemaClass): TftTrait {
    const domainEntity = new TftTrait();
    domainEntity.id = raw._id.toString();
    domainEntity.apiName = raw.apiName;
    domainEntity.name = raw.name;
    domainEntity.enName = raw.enName;
    domainEntity.desc = raw.desc;
    // Always generate icon from CDN (override any existing icon in DB)
    domainEntity.icon = TftTraitMapper.generateIconUrl(raw.apiName, raw.name);
    domainEntity.effects = raw.effects || [];
    domainEntity.units = raw.units || [];
    domainEntity.unitProperties = raw.unitProperties || {};
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: TftTrait): TftTraitSchemaClass {
    const persistenceSchema = new TftTraitSchemaClass();

    if (domainEntity.id && typeof domainEntity.id === 'string') {
      persistenceSchema._id = domainEntity.id;
    }

    persistenceSchema.apiName = domainEntity.apiName;
    persistenceSchema.name = domainEntity.name;
    persistenceSchema.enName = domainEntity.enName;
    persistenceSchema.desc = domainEntity.desc;
    persistenceSchema.icon = domainEntity.icon;
    persistenceSchema.effects = domainEntity.effects || [];
    persistenceSchema.units = domainEntity.units || [];
    persistenceSchema.unitProperties = domainEntity.unitProperties || {};
    persistenceSchema.createdAt = domainEntity.createdAt;
    persistenceSchema.updatedAt = domainEntity.updatedAt;
    persistenceSchema.deletedAt = domainEntity.deletedAt;

    return persistenceSchema;
  }
}

