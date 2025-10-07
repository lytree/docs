export interface SocialLink {
    /** 站点图标 */
    icon?: string | { svg: string }
    /** 站点链接 */
    link: string
}

export interface NavLink extends SocialLink {
    /** 站点名称 */
    title?: string
    /** 站点描述 */
    desc?: string
}



export interface Cover {
    background?: {
        src: () => string,
        color?: string
    },
    title?: string,
    avatar?: string,
    description?: string,
    typed?: {
        strings: string[]
    },
    socialLinks: SocialLink[],
    wave?: {
        enable: boolean,
    }
}