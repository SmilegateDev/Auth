module.exports = (sequelize, DataTypes)=>(
    sequelize.define('follow',{

        like_num : {
            type : DataTypes.INTEGER,
            allowNull : false,
            defaultValue : 0,
        },

        comment_num : {
            type : DataTypes.INTEGER,
            allowNull : false,
            defaultValue : 0,
        },


        status : {
            type : DataTypes.TINYINT(1),
            allowNull : false,
            defaultValue : 1,
        },
    
    },
    
        {
            paranoid : true,
        }

    
    )

);