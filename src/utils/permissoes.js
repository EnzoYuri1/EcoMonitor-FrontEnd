export function ehResponsavel(item, user) {
  return Number(item?.created_by) === Number(user?.id)
}

export function podeGerenciarOcorrencia(item, user) {
  if (!item || !user) return false
  return user.perfil === 'admin' || ehResponsavel(item, user)
}
