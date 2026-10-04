"""Compañero reproducible de la lección «El big bang del deep learning» (model.ts).

Mismo algoritmo que `gradRun` en model.ts, escrito con numpy:
  · pila de D capas de ancho 16:  h_{l+1} = tanh(W_l h_l)   (simple)   o   h_l + tanh(W_l h_l)   (residual)
  · pesos W_l ~ N(0, σ²/16) con σ² = 1/3  (la inicialización «estándar» de la época, U(−1/√n, 1/√n):
    Glorot y Bengio, 2010, ec. 15: n·Var[W] = 1/3)
  · se retropropaga un gradiente de norma 1 desde la salida y se mide la norma que llega tras k capas hacia atrás.
La red NO está entrenada y NO lleva normalización: es un juguete para ver el efecto de la profundidad y del atajo.

Los números exactos dependen del generador aleatorio (aquí numpy, en la escena rng() del kit); el orden de magnitud no.
Uso:  python3 gradients.py
"""
import numpy as np


def grad_norms(depth, residual, width=16, seed=0):
    rng = np.random.default_rng(seed)
    W = rng.normal(0.0, np.sqrt(1 / 3) / np.sqrt(width), size=(depth, width, width))
    h = rng.normal(size=width)
    cache = []
    for l in range(depth):                          # pase hacia delante
        t = np.tanh(W[l] @ h)
        cache.append(t)
        h = h + t if residual else t
    g = np.ones(width) / np.sqrt(width)             # gradiente de norma 1 en la salida
    norms = [np.linalg.norm(g)]
    for l in reversed(range(depth)):                # retropropagación
        branch = W[l].T @ (g * (1 - cache[l] ** 2))  # derivada de tanh y transpuesta de W
        g = g + branch if residual else branch      # con atajo: el gradiente pasa intacto y se SUMA la rama
        norms.append(np.linalg.norm(g))
    return norms                                    # norms[k] = norma tras k capas hacia atrás


def finite_difference_check(depth=10, residual=False, width=16, seed=0, eps=1e-6):
    """Comprueba la retropropagación contra diferencias finitas (norma del gradiente respecto de la entrada)."""
    rng = np.random.default_rng(seed)
    W = rng.normal(0.0, np.sqrt(1 / 3) / np.sqrt(width), size=(depth, width, width))
    x0 = rng.normal(size=width)

    def out(x):
        h = x
        for l in range(depth):
            t = np.tanh(W[l] @ h)
            h = h + t if residual else t
        return h.sum() / np.sqrt(width)             # L = suma de la salida / √16  →  gradiente de salida de norma 1

    fd = np.array([(out(x0 + eps * e) - out(x0 - eps * e)) / (2 * eps) for e in np.eye(width)])
    return np.linalg.norm(fd), grad_norms(depth, residual, width, seed)[depth]


if __name__ == "__main__":
    for res in (False, True):
        n = grad_norms(40, res)
        print("con atajos" if res else "sin atajos", f"  tras 10 capas: {n[10]:.2e}   tras 40 capas: {n[40]:.2e}")
    for res in (False, True):
        fd, an = finite_difference_check(10, res)
        print(f"comprobación (residual={res}): diferencias finitas {fd:.6e}  vs  retropropagación {an:.6e}")
    # distribución sobre semillas (mismas condiciones): la conclusión no depende de una semilla afortunada
    plain = [grad_norms(40, False, seed=s)[40] for s in range(1, 13)]
    resid = [grad_norms(40, True, seed=s)[40] for s in range(1, 13)]
    print(f"12 semillas, 40 capas: simple {min(plain):.1e} … {max(plain):.1e}   residual {min(resid):.1f} … {max(resid):.1f}")
