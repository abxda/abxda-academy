import type { SceneFactory } from '../../../../../core/scene/frame';
const scene: SceneFactory = () => ({
  controls: [{ id: 'x', kind: 'slider', label: { es: 'Valor', en: 'Value' }, min: 0, max: 1, step: 0.01, value: 0.3, from: 'rules' }],
  render(S) {
    const { d, pal } = S;
    const a = S.reveal('intro');
    d.withAlpha(a, () => d.text(S.l('Programar vs. aprender', 'Programming vs. learning'), S.W / 2, S.H / 2 - 20, { size: 26, weight: 800, align: 'center' }));
    if (S.on('rules')) d.circle(S.W * (0.2 + 0.6 * (S.p.x ?? 0.3)), S.H / 2 + 40, 14, { fill: pal.sig });
  },
});
export default scene;
