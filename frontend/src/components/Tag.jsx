const TYPE_CLASS = {
  mysql: 'tag--mysql',
  postgres: 'tag--postgres',
  postgresql: 'tag--postgres',
  mongodb: 'tag--mongodb',
}

function Tag({ children, type }) {
  const typeClass = TYPE_CLASS[type?.toLowerCase()] || 'tag--default'

  return <span className={`tag ${typeClass}`}>{children}</span>
}

export default Tag
