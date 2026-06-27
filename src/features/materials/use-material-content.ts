import { useEffect, useState } from 'react';
import { loadMaterialContent, type MaterialMeta, type MaterialWithContent } from '../../materials/loader';

type MaterialContentState =
  | { status: 'loading'; material: null }
  | { status: 'ready'; material: MaterialWithContent }
  | { status: 'error'; material: null };

export function useMaterialContent(material: MaterialMeta): MaterialContentState {
  const [state, setState] = useState<MaterialContentState>({ status: 'loading', material: null });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', material: null });

    loadMaterialContent(material)
      .then((nextMaterial) => {
        if (cancelled) return;
        setState({ status: 'ready', material: nextMaterial });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ status: 'error', material: null });
      });

    return () => {
      cancelled = true;
    };
  }, [material]);

  return state;
}
