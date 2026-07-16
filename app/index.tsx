import React from "react";
import { Redirect } from "expo-router";
import { useAuthStore } from "@store/authStore";
import { ROUTES } from "@/constants/route";

export default function Index() {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    if (user.consent_given === false) {
      return <Redirect href={ROUTES.CONSENT.CONSENT} />;
    }
    switch (user.role) {
      case "teacher":
        return <Redirect href={ROUTES.TEACHER.DASHBOARD} />;
      case "conductor":
        return <Redirect href={ROUTES.CONDUCTOR.ROUTE} />;
      case "parent":
      default:
        return <Redirect href={ROUTES.PARENT.DASHBOARD} />;
    }
  }

  return <Redirect href={ROUTES.AUTH.LOGIN} />;
}
