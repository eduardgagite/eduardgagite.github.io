import { useEffect } from 'react';
import type { MaterialMeta, MaterialsTree } from '../../materials/loader';
import { generateMaterialSEO, resetSEO, updateSEO } from '../../utils/seo';
import { buildMaterialRoutePath, getAvailableMaterialLanguages } from './article-navigation';

interface UseMaterialSeoArgs {
  material: MaterialMeta;
  tree: MaterialsTree;
}

export function useMaterialSeo({ material, tree }: UseMaterialSeoArgs) {
  useEffect(() => {
    const seoData = generateMaterialSEO(
      material,
      buildMaterialRoutePath(material),
      getAvailableMaterialLanguages({ material, tree }),
    );
    updateSEO(seoData);
    return () => {
      resetSEO();
    };
  }, [material, tree]);
}
