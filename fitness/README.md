# Fit — registro diario de fitness

App personal para registrar peso, macros y entrenos en menos de 40 segundos al día,
pensada para usarse desde el iPhone.

## Instalarla en el iPhone

> **Hazlo en este orden.** En iOS, Safari y las apps de la pantalla de inicio usan
> almacenamientos separados. Si registras datos en Safari y después la instalas, la
> app arranca vacía.

1. Abre la URL en **Safari** (no Chrome: solo Safari puede instalar en iOS).
2. Botón **Compartir** → **Añadir a pantalla de inicio**.
3. Ábrela desde el icono nuevo y empieza a registrar.

## Dónde viven los datos

En el propio teléfono (`localStorage` del navegador). No hay servidor, ni cuenta, ni
login: nada sale del dispositivo.

Las dos consecuencias que importan:

- **No se sincroniza entre dispositivos.** Lo que registras en el iPhone no aparece en
  la laptop.
- **Si borras los datos de Safari, se pierden.** Por eso existe **Metas → Exportar**,
  que descarga un `.json` con todo. Guárdalo de vez en cuando; **Importar** lo restaura.

Migrar a una base de datos en la nube más adelante no obliga a reescribir pantallas:
toda la app habla con la interfaz `Store` (`lib/store.ts`), y `lib/localStore.ts` es
solo una implementación de esa interfaz.

## Pantallas

| Pantalla | Para qué |
|---|---|
| **Hoy** | El registro diario. Un solo formulario, autoguardado por campo, sin botón de guardar |
| **Semana** | Media móvil de peso 7d, sesiones vs. objetivo, racha, y los últimos 7 días |
| **Tendencias** | Peso a 8 semanas, adherencia semanal, proteína y kcal vs. objetivo |
| **Metas** | Objetivos editables + exportar/importar respaldo |

Atajos de fricción en **Hoy**:

- Las **kcal se calculan solas** desde proteína/carbos/grasa (4/4/9). Si escribes las
  kcal a mano, manda tu número y deja de recalcularse ese día.
- Un tap en el tipo de entreno lo marca como completado y despliega RPE y duración.
  Otro tap lo borra.
- Ánimo, sueño y notas van colapsados: no estorban si no los usas.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build de producción
node scripts/gen-icons.mjs   # regenera los iconos PNG de la PWA
```

Stack: Next.js (App Router) · React · TypeScript · Tailwind v4. Sin dependencias de
runtime más allá de esas: los gráficos son SVG y CSS escritos a mano.

El service worker (`public/sw.js`) solo se registra en producción — en desarrollo pelea
con el hot reload.
