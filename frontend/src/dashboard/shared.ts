import { requestJson } from "../api";

export async function sendFollow(userId: string): Promise<void> {
  await requestJson<{ success: boolean }>("/follow", {
    method: "POST",
    body: { user_id: userId },
  });
}

export async function sendUnfollow(userId: string): Promise<void> {
  await requestJson<{ success: boolean }>("/follow", {
    method: "DELETE",
    body: { user_id: userId },
  });
}
