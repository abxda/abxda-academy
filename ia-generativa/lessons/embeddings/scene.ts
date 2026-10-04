import type { SceneFactory } from '../../../../../theme/kit';
const scene: SceneFactory = () => ({
  render(S) { S.d.text(`${Math.round(S.W)}x${Math.round(S.H)} u=${S.u.toFixed(2)} portrait=${S.portrait}`, 20, 40, { size: 20 }); },
});
export default scene;
