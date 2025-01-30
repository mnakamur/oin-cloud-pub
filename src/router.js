import { createRouter, createWebHistory } from "vue-router";
import signin from "./components/SignIn.vue";
import signroot from "./components/SignRoot.vue";
import signdo from "./components/SignDo.vue";
import signcomplete from "./components/SignComplete.vue";
import signmanage from "./components/SignManage.vue";
import signstatus from "./components/SignStatus.vue";
import userprofile from "./components/UserProfile.vue";

const routes = [
  { path: "/", name: "signin", component: signin },
  { path: "/signroot", name: "signroot", component: signroot },
  { path: "/signmanage", name: "signmanage", component: signmanage },
  { path: "/userprofile", name: "userprofile", component: userprofile },
  { path: "/signdo/:param", name: "signdo", component: signdo },
  {
    path: "/signComplete/:param",
    name: "signcomplete",
    component: signcomplete,
  },
  { path: "/signStatus/:param", name: "signstatus", component:signstatus,props:true },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
