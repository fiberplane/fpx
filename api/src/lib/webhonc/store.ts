// This is a simple store for the webhonc connection id that should be set
// whenever the app boots up and establishes a connection with the webhonc
// service.
let webhoncConnectionId: string | undefined = undefined;

export function setWebHoncConnectionId(id: string) {
  webhoncConnectionId = id;
}

export function getWebHoncConnectionId() {
  return webhoncConnectionId;
}
