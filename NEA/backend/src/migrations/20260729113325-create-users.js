module.exports = {
  async up(queryInterface, Sequelize) {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT to_regclass('public.users') AS table_name",
    )

    if (rows[0].table_name) {
      return
    }

    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      role: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'user',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          'CURRENT_TIMESTAMP',
        ),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          'CURRENT_TIMESTAMP',
        ),
      },
    })
  },

  async down(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT to_regclass('public.users') AS table_name",
    )

    if (rows[0].table_name) {
      await queryInterface.dropTable('users')
    }
  },
}