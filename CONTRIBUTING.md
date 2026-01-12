# 🤝 Guide de Contribution

Merci de votre intérêt pour contribuer à Subscription Tracker ! Ce document vous guidera à travers le processus.

## 📋 Code of Conduct

Soyez respectueux, inclusif et constructif dans toutes vos interactions.

## 🚀 Comment Contribuer

### Signaler un Bug 🐛

1. Vérifiez que le bug n'a pas déjà été signalé dans les [Issues](https://github.com/237films-bot/claude-subIA/issues)
2. Créez une nouvelle issue avec le template "Bug Report"
3. Incluez :
   - Description claire du bug
   - Étapes pour reproduire
   - Comportement attendu vs observé
   - Screenshots si pertinent
   - Environnement (OS, navigateur, version)

### Proposer une Fonctionnalité 💡

1. Vérifiez la roadmap et les issues existantes
2. Créez une issue avec le template "Feature Request"
3. Décrivez :
   - Le problème que cela résout
   - La solution proposée
   - Des alternatives envisagées
   - Des exemples d'utilisation

### Soumettre une Pull Request 🔀

1. **Fork** le repository
2. **Clone** votre fork localement

```bash
git clone https://github.com/VOTRE-USERNAME/claude-subIA.git
cd claude-subIA
```

3. **Créer une branche** descriptive

```bash
git checkout -b feature/ma-super-fonctionnalite
# ou
git checkout -b fix/correction-bug-xyz
```

4. **Installer** les dépendances

```bash
npm install
```

5. **Faire vos modifications** en suivant les guidelines ci-dessous

6. **Tester** vos changements

```bash
npm run test
npm run type-check
npm run lint
```

7. **Commit** avec un message clair

```bash
git commit -m "feat: ajoute support pour notifications push"
# ou
git commit -m "fix: corrige calcul des jours de renouvellement"
```

8. **Push** vers votre fork

```bash
git push origin feature/ma-super-fonctionnalite
```

9. **Créer une Pull Request** sur GitHub

## 📐 Guidelines de Code

### TypeScript

- ✅ Mode strict activé - respectez-le !
- ✅ Typage explicite pour toutes les fonctions publiques
- ✅ Pas de `any` - utilisez `unknown` et type guards
- ✅ Interfaces pour les objets complexes

```typescript
// ✅ Bon
interface User {
  id: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ Mauvais
function getUser(id: any): any {
  // ...
}
```

### React

- ✅ Hooks pour la logique
- ✅ Props typées avec interfaces
- ✅ Composants fonctionnels
- ✅ Noms descriptifs

```tsx
// ✅ Bon
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ label, onClick, variant = 'primary' }) => {
  return <button onClick={onClick} className={variant}>{label}</button>;
};

// ❌ Mauvais
export const Button = (props: any) => {
  return <button>{props.label}</button>;
};
```

### Validation

- ✅ Zod pour toutes les entrées utilisateur
- ✅ Validation côté client ET serveur

```typescript
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Utilisation
const result = userSchema.safeParse(data);
if (!result.success) {
  console.error(result.error);
}
```

### Gestion d'Erreurs

- ✅ Utilisez `useErrorHandler` hook
- ✅ Toast notifications pour informer l'utilisateur
- ✅ Logs console pour debugging

```typescript
const { handleError, handleSuccess } = useErrorHandler();

try {
  await saveData();
  handleSuccess(t('success.dataSaved'));
} catch (error) {
  handleError(error, 'saveData');
}
```

### Internationalisation

- ✅ Tous les textes UI dans `locales/fr.json` et `locales/en.json`
- ✅ Utilisez `useTranslation` hook
- ❌ Jamais de texte hardcodé

```tsx
// ✅ Bon
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  return <h1>{t('subscriptions.title')}</h1>;
};

// ❌ Mauvais
const MyComponent = () => {
  return <h1>Mes Abonnements</h1>;
};
```

### Tests

- ✅ Tests unitaires pour la logique métier
- ✅ Minimum 70% de couverture pour nouveaux fichiers
- ✅ Noms descriptifs

```typescript
describe('getDaysUntilRenewal', () => {
  it('calcule correctement les jours pour renouvellement mensuel', () => {
    const result = getDaysUntilRenewal(15, 'monthly');
    expect(result).toBeGreaterThanOrEqual(0);
  });
});
```

### Commits

Suivez la convention [Conventional Commits](https://www.conventionalcommits.org/) :

- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `style:` Formatage (pas de changement de code)
- `refactor:` Refactoring
- `test:` Ajout de tests
- `chore:` Tâches maintenance

Exemples :
```
feat: ajoute export CSV des abonnements
fix: corrige calcul de renouvellement pour février
docs: améliore README avec exemples
test: ajoute tests pour dateUtils
```

## 🧪 Tests

```bash
# Lancer tous les tests
npm run test

# Mode watch (pendant le développement)
npm run test -- --watch

# Avec couverture
npm run test:coverage

# Interface UI
npm run test:ui
```

## 🎨 Style & Linting

```bash
# Vérifier le style
npm run lint

# Vérifier TypeScript
npm run type-check
```

Avant chaque commit, assurez-vous que :
- ✅ Tous les tests passent
- ✅ Pas d'erreurs TypeScript
- ✅ Pas d'erreurs ESLint

## 📝 Documentation

- Commentez les fonctions complexes avec JSDoc
- Mettez à jour le README si vous ajoutez des fonctionnalités
- Ajoutez des exemples d'utilisation

```typescript
/**
 * Calcule le nombre de jours avant le prochain renouvellement
 * @param renewalDay - Jour du mois (1-31)
 * @param billingCycle - 'monthly' ou 'annual'
 * @param renewalMonth - Mois pour cycle annuel (1-12)
 * @returns Nombre de jours restants
 */
export function getDaysUntilRenewal(
  renewalDay: number,
  billingCycle: BillingCycle = 'monthly',
  renewalMonth?: number
): number {
  // Implementation...
}
```

## 🔍 Code Review

Votre PR sera reviewée pour :

- ✅ Respect des guidelines
- ✅ Tests passent
- ✅ Code documenté
- ✅ Pas de régression
- ✅ Performance acceptable

## 🎯 Priorités Actuelles

Voir les issues avec le label `good first issue` pour commencer !

Domaines où nous avons besoin d'aide :
- 🧪 Augmenter la couverture de tests
- 📱 Améliorer l'UX mobile
- 🌍 Ajouter plus de langues (ES, DE, IT)
- 📊 Nouveaux types de graphiques
- 🔌 Intégrations tierces

## 💬 Questions ?

- Ouvrez une [Discussion](https://github.com/237films-bot/claude-subIA/discussions)
- Rejoignez notre [Discord](#) (si applicable)
- Envoyez un email à [contact@subscriptiontracker.app](#) (si applicable)

---

Merci de contribuer ! 🎉
