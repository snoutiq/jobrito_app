# JobConnect Architecture Overview

यह file project ke core structure ko simple language me explain karti hai.

## 1. Folder Design

Project ko `src/` ke andar modular tarike se organize kiya gaya hai:

- `src/app/`
  - Global Redux store yahan define hai.
- `src/navigation/`
  - App ke screen flow aur navigation stacks/tabs yahan manage hote hain.
  - `RootNavigator` app start hone par auth ya main app decide karta hai.
  - `AuthNavigator` login-related screens handle karta hai.
  - `MainTabs` logged-in user ke main tabs manage karta hai.
- `src/services/`
  - API calls aur storage related logic yahan hai.
  - Screens directly API ko call nahi karti.
- `src/redux/`
  - Redux slices, async thunks, aur global state yahan manage hota hai.
- `src/constants/`
  - Colors, endpoints, aur roles jaisi fixed values yahan rakhi gayi hain.
- `src/components/`
  - Reusable UI pieces yahan hain, jaise buttons, inputs, cards, loader, badge.
- `src/screens/`
  - Actual app screens yahan hain: auth, home, jobs, employer, chef, profile, applications.
- `src/i18n/`
  - Multilingual setup yahan defined hai.

Ye design scalable hai kyunki har concern alag folder me split hai:

- UI components alag
- business/data logic alag
- state management alag
- navigation alag

## 2. API Kaise Work Kar Rahi Hai

API flow layered architecture follow karta hai:

1. Screen me user action hota hai
2. Screen Redux thunk dispatch karti hai
3. Thunk service file ko call karti hai
4. Service file `apiClient.js` use karti hai
5. `apiClient.js` Axios instance handle karta hai

### API layer details

- `src/services/apiClient.js`
  - Axios instance create karta hai
  - `baseURL` `src/constants/endpoints.js` se leta hai
  - `timeout` 15000 set hai
  - request interceptor token attach karta hai
  - response interceptor error normalize karta hai

- `src/services/storage.js`
  - AsyncStorage access sirf yahan hota hai
  - token, role, profile save/read yahin se hota hai

- Service files
  - `authApi.js`
  - `jobApi.js`
  - `applicationApi.js`
  - `employerApi.js`
  - `chefApi.js`
  - `profileApi.js`
  - `notificationApi.js`

Ye service files backend ke liye ready hain, aur abhi fallback sample data bhi return karti hain taaki app bina backend ke run ho sake.

### Practical example

`applyJob(jobId)` flow:

- screen button press
- Redux thunk `applyJob`
- service `applicationApi.applyJob`
- `apiClient.post(...)`
- agar backend fail ho ya available na ho, sample success response return hota hai

Is approach ka benefit:

- screens clean rehti hain
- API logic repeat nahi hota
- future backend changes sirf service layer me karne padenge

## 3. i18n Kaise Work Kar Raha Hai

Internationalization setup `src/i18n/` me hai.

### Files

- `src/i18n/index.js`
  - `i18next` initialize karta hai
  - `react-i18next` ko integrate karta hai
  - default language `en` rakhta hai
  - fallback language bhi `en` hai

- `src/i18n/en.json`
  - English translations

- `src/i18n/hi.json`
  - Hindi translations

### Flow

1. App start hote hi `App.js` me `import "./src/i18n";`
2. i18n initialize ho jata hai
3. Screens me `useTranslation()` use hota hai
4. `t("key")` se translated text milta hai

### Important rule

- User-generated content translate nahi karna hai
- Sirf app labels, buttons, headings, aur static text translation ke liye rakhe gaye hain

### Future expansion

Agar aur languages add karni ho, bas new JSON file add karke `resources` me register karna hai.

## 4. Redux Kaise Work Kar Raha Hai

Redux Toolkit global state manage karta hai.

### Store

`src/app/store.js` me store configure hai aur slices register hain:

- `auth`
- `user`
- `job`
- `application`
- `employer`
- `chef`
- `notification`

### Slice structure

Har slice me generally ye pattern hai:

- `data`
- `loading`
- `error`
- `success` where needed

### Async thunk flow

Redux thunks data fetching ya update ke liye use ho rahe hain:

- `requestOtp`
- `verifyOtp`
- `fetchFeedJobs`
- `fetchJobDetails`
- `applyJob`
- `fetchApplicationHistory`
- `submitCommunityJob`
- `fetchEmployerDashboard`
- `fetchApplicants`
- `updateApplicantStatus`
- `fetchChefProfiles`
- `fetchProfile`
- `updateProfile`
- `switchUserRole`

### Redux flow example

`HomeScreen` example:

- screen `dispatch(fetchFeedJobs(activeFilter))`
- thunk `jobApi.getFeedJobs(filter)` call karta hai
- service `apiClient` use karti hai
- slice me `feedJobs`, `loading`, `error` update hota hai
- screen `useSelector` se data read karti hai

### Why this is useful

- global state centralized rehta hai
- loading and error handling consistent hoti hai
- service layer aur UI layer separate rehte hain
- future features easily add ho sakte hain

## 5. App Entry Flow

Startup flow:

1. `App.js`
2. `Provider`
3. `NavigationContainer`
4. `RootNavigator`
5. `SplashScreen`
6. token ho to `MainTabs`
7. token na ho to `AuthNavigator`

## 6. Summary

Ye architecture aise design ki gayi hai ki:

- app immediately run ho sake
- backend ke bina sample data mil jaye
- code clean aur scalable rahe
- future me real API integrate karna easy ho

