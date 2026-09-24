import { StreamChat } from "stream-chat";
import { supabase } from "./supabase";

const apiKey = process.env.EXPO_PUBLIC_STREAM_API_KEY;

let streamClient;

export function getStreamClient() {
  if (!apiKey) {
    throw new Error("EXPO_PUBLIC_STREAM_API_KEY belum dikonfigurasi.");
  }

  if (!streamClient) {
    streamClient = StreamChat.getInstance(apiKey);
  }

  return streamClient;
}

export async function getStreamUserToken(user) {
  const { data, error } = await supabase.functions.invoke("stream-token", {
    body: {
      userId: user.id,
      name: user.user_metadata?.nama || "Pengguna",
    },
  });

  if (error) {
    throw new Error(error.message || "Token Stream tidak dapat dibuat.");
  }

  if (!data?.token) {
    throw new Error("Token Stream tidak diterima dari server.");
  }

  return data.token;
}

export async function connectStreamUser(user, token) {
  const client = getStreamClient();

  if (client.user?.id === user.id) {
    return client;
  }

  if (client.user) {
    await client.disconnectUser();
  }

  await client.connectUser(
    { id: user.id, name: user.user_metadata?.nama || "Pengguna" },
    token,
  );

  return client;
}

export function getConsultationChannelId(id) {
  return `konsultasi-${id}`;
}
