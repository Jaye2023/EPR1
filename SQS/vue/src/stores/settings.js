import { defineStore } from 'pinia'
import { ref } from 'vue'
import { settingsApi } from '../api'

export const useSettingsStore = defineStore('settings', () => {
  const loading = ref(false)
  
  // 铜价相关
  const copperPrice = ref(0)
  const copperProcessFee = ref(0)
  const copperPriceSyncedAt = ref(null)
  const fillerPrice = ref(0)
  
  // 材料价格
  const pvcMaterialPriceEU = ref(0)
  const pvcMaterialPriceUS = ref(0)
  const rubberMaterialPriceEU = ref(0)
  const rubberMaterialPriceUS = ref(0)
  const xlpeMaterialPrice = ref(0)
  const xlpoMaterialPrice = ref(0)
  const tpeMaterialPrice = ref(0)
  const epdmMaterialPrice = ref(0)
  const siliconeMaterialPrice = ref(0)
  
  // 利润率
  const profitMargins = ref({})
  
  // 材料配置
  const materials = ref({})
  
  // 线种映射
  const wireTypeMapping = ref({})

  async function loadSettings() {
    loading.value = true
    try {
      const settings = await settingsApi.get()
      
      // 铜价相关
      copperPrice.value = settings.copperPrice || settings.baseCosts?.copperPrice || 0
      copperProcessFee.value = settings.copperProcessFee || settings.baseCosts?.copperProcessFee || 0
      fillerPrice.value = settings.fillerPrice || settings.baseCosts?.fillerPrice || 0
      
      // 材料价格
      pvcMaterialPriceEU.value = settings.pvcMaterialPriceEU || settings.regionalSettings?.EU?.pvcPrice || settings.materials?.PVC?.priceEU || 0
      pvcMaterialPriceUS.value = settings.pvcMaterialPriceUS || settings.regionalSettings?.US?.pvcPrice || settings.materials?.PVC?.priceUS || 0
      rubberMaterialPriceEU.value = settings.rubberMaterialPriceEU || settings.regionalSettings?.EU?.rubberPrice || settings.materials?.Rubber?.priceEU || 0
      rubberMaterialPriceUS.value = settings.rubberMaterialPriceUS || settings.regionalSettings?.US?.rubberPrice || settings.materials?.Rubber?.priceUS || 0
      xlpeMaterialPrice.value = settings.xlpeMaterialPrice || settings.materials?.XLPE?.price || 0
      xlpoMaterialPrice.value = settings.xlpoMaterialPrice || settings.materials?.XLPO?.price || 0
      tpeMaterialPrice.value = settings.tpeMaterialPrice || settings.materials?.TPE?.price || 0
      epdmMaterialPrice.value = settings.epdmMaterialPrice || settings.materials?.EPDM?.price || 0
      siliconeMaterialPrice.value = settings.siliconeMaterialPrice || settings.materials?.Silicone?.price || 0
      
      // 利润率
      profitMargins.value = settings.profitMargins || {}
      
      // 材料配置
      materials.value = settings.materials || {}
      
      // 线种映射
      wireTypeMapping.value = settings.wireTypeMapping || {}
      
      return settings
    } catch (error) {
      console.error('Failed to load settings:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  function getMaterialPrice(materialType, region = 'CN') {
    const priceMap = {
      PVC: region === 'EU' ? pvcMaterialPriceEU.value : pvcMaterialPriceUS.value || pvcMaterialPriceEU.value,
      Rubber: region === 'EU' ? rubberMaterialPriceEU.value : rubberMaterialPriceUS.value || rubberMaterialPriceEU.value,
      XLPE: xlpeMaterialPrice.value,
      XLPO: xlpoMaterialPrice.value,
      TPE: tpeMaterialPrice.value,
      EPDM: epdmMaterialPrice.value,
      Silicone: siliconeMaterialPrice.value
    }
    return priceMap[materialType] || 0
  }

  function getProfitMargin(materialType) {
    return profitMargins.value[materialType] || profitMargins.value.default || 0.85
  }

  function getMaterialByWireType(wireType) {
    if (!wireType) return null
    const upperType = wireType.toUpperCase()
    
    // 精确匹配
    if (wireTypeMapping.value[upperType]) {
      return wireTypeMapping.value[upperType]
    }
    
    // 模糊匹配
    for (const [key, value] of Object.entries(wireTypeMapping.value)) {
      if (upperType.includes(key) || key.includes(upperType)) {
        return value
      }
    }
    
    // 默认返回PVC
    return 'PVC'
  }

  return {
    loading,
    copperPrice,
    copperProcessFee,
    fillerPrice,
    pvcMaterialPriceEU,
    pvcMaterialPriceUS,
    rubberMaterialPriceEU,
    rubberMaterialPriceUS,
    xlpeMaterialPrice,
    xlpoMaterialPrice,
    tpeMaterialPrice,
    epdmMaterialPrice,
    siliconeMaterialPrice,
    profitMargins,
    materials,
    wireTypeMapping,
    loadSettings,
    getMaterialPrice,
    getProfitMargin,
    getMaterialByWireType
  }
})