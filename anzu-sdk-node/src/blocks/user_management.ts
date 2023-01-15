import { api } from "../api";

export namespace userManagement {
  export async function confirmUserIdentityProvisioning(
    client: api.Client,
    userIdentityId: string
  ) {
    client.mustWorkspace();
    client.mustEnvironment();

    await client.patch(`/user_management/user_identities/${userIdentityId}`, {
      provisioning_status: "complete",
    });
  }
}
